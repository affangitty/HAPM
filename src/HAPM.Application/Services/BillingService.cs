using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class BillingService : IBillingService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;

    public BillingService(IUnitOfWork uow, ICurrentUserService currentUser, INotificationService notifications)
    {
        _uow = uow;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    public async Task<PagedResult<InvoiceDto>> GetPagedAsync(InvoiceQueryParams query, CancellationToken ct = default)
    {
        var invoices = await ScopeToCurrentUserAsync(_uow.Invoices.Query(), ct);

        if (query.PatientId.HasValue)
            invoices = invoices.Where(i => i.PatientId == query.PatientId.Value);

        if (query.Status.HasValue)
            invoices = invoices.Where(i => i.Status == query.Status.Value);

        if (query.FromDate.HasValue)
        {
            var from = query.FromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            invoices = invoices.Where(i => i.CreatedAtUtc >= from);
        }

        if (query.ToDate.HasValue)
        {
            var to = query.ToDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            invoices = invoices.Where(i => i.CreatedAtUtc < to);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            invoices = invoices.Where(i =>
                i.InvoiceNumber.ToLower().Contains(term) ||
                i.Patient.User.FullName.ToLower().Contains(term) ||
                i.Patient.MedicalRecordNumber.ToLower().Contains(term));
        }

        invoices = (query.SortBy?.ToLowerInvariant(), query.SortDescending) switch
        {
            ("total", false) => invoices.OrderBy(i => i.TotalAmount),
            ("total", true) => invoices.OrderByDescending(i => i.TotalAmount),
            ("createdat", false) => invoices.OrderBy(i => i.CreatedAtUtc),
            (_, _) => invoices.OrderByDescending(i => i.CreatedAtUtc)
        };

        return await invoices.Select(Projections.Invoice).ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<InvoiceDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var scoped = await ScopeToCurrentUserAsync(_uow.Invoices.Query(), ct);
        return await scoped
            .Where(i => i.Id == id)
            .Select(Projections.Invoice)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Invoice", id);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct = default)
    {
        var patient = await _uow.Patients.Query()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == request.PatientId, ct)
            ?? throw new NotFoundException("Patient", request.PatientId);

        var items = request.Items.Select(i => new InvoiceItem
        {
            Description = i.Description.Trim(),
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            Amount = i.Quantity * i.UnitPrice
        }).ToList();

        if (request.AppointmentId.HasValue)
        {
            var appointment = await _uow.Appointments.Query()
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .FirstOrDefaultAsync(a => a.Id == request.AppointmentId.Value, ct)
                ?? throw new NotFoundException("Appointment", request.AppointmentId.Value);

            if (appointment.PatientId != request.PatientId)
                throw new BadRequestException("The appointment does not belong to this patient.");

            if (await _uow.Invoices.Query().AnyAsync(i => i.AppointmentId == request.AppointmentId.Value && i.Status != InvoiceStatus.Cancelled, ct))
                throw new ConflictException("An invoice already exists for this appointment.");

            items.Insert(0, new InvoiceItem
            {
                Description = $"Consultation - Dr. {appointment.Doctor.User.FullName} ({appointment.Doctor.Specialization})",
                Quantity = 1,
                UnitPrice = appointment.Doctor.ConsultationFee,
                Amount = appointment.Doctor.ConsultationFee
            });
        }

        if (items.Count == 0)
            throw new BadRequestException("An invoice must contain at least one line item.");

        var (subTotal, taxAmount, total) = InvoiceMath.Calculate(items.Select(i => i.Amount), request.TaxPercent, request.DiscountAmount);

        if (total < 0)
            throw new BadRequestException("Discount cannot exceed the invoice total.");

        var invoice = new Invoice
        {
            InvoiceNumber = await GenerateInvoiceNumberAsync(ct),
            PatientId = request.PatientId,
            AppointmentId = request.AppointmentId,
            SubTotal = subTotal,
            TaxPercent = request.TaxPercent,
            TaxAmount = taxAmount,
            DiscountAmount = request.DiscountAmount,
            TotalAmount = total,
            Notes = request.Notes,
            Items = items
        };

        await _uow.Invoices.AddAsync(invoice, ct);
        await _uow.SaveChangesAsync(ct);

        await _notifications.NotifyAsync(patient.UserId, NotificationType.InvoiceGenerated,
            "Invoice generated", $"Invoice {invoice.InvoiceNumber} for {invoice.TotalAmount:0.00} has been generated.", ct);

        return await GetByIdUnscopedAsync(invoice.Id, ct);
    }

    public async Task<InvoiceDto> UpdateAsync(int id, UpdateInvoiceRequest request, CancellationToken ct = default)
    {
        var invoice = await _uow.Invoices.QueryTracked()
            .Include(i => i.Items)
            .Include(i => i.Appointment).ThenInclude(a => a!.Doctor).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(i => i.Id == id, ct) ?? throw new NotFoundException("Invoice", id);

        if (invoice.Status != InvoiceStatus.Pending)
            throw new ConflictException($"Only pending invoices can be updated (current status: {invoice.Status}).");

        var items = request.Items.Select(i => new InvoiceItem
        {
            Description = i.Description.Trim(),
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            Amount = i.Quantity * i.UnitPrice
        }).ToList();

        // Preserve the auto-added consultation line when the invoice is linked to an appointment.
        if (invoice.AppointmentId.HasValue && invoice.Appointment is not null)
        {
            var appt = invoice.Appointment;
            var consultationDesc = $"Consultation - Dr. {appt.Doctor.User.FullName} ({appt.Doctor.Specialization})";
            if (!items.Any(i => i.Description == consultationDesc))
            {
                items.Insert(0, new InvoiceItem
                {
                    Description = consultationDesc,
                    Quantity = 1,
                    UnitPrice = appt.Doctor.ConsultationFee,
                    Amount = appt.Doctor.ConsultationFee
                });
            }
        }

        if (items.Count == 0)
            throw new BadRequestException("An invoice must contain at least one line item.");

        var (subTotal, taxAmount, total) = InvoiceMath.Calculate(items.Select(i => i.Amount), request.TaxPercent, request.DiscountAmount);

        if (total < 0)
            throw new BadRequestException("Discount cannot exceed the invoice total.");

        invoice.Items.Clear();
        foreach (var item in items)
            invoice.Items.Add(item);

        invoice.SubTotal = subTotal;
        invoice.TaxPercent = request.TaxPercent;
        invoice.TaxAmount = taxAmount;
        invoice.DiscountAmount = request.DiscountAmount;
        invoice.TotalAmount = total;
        invoice.Notes = request.Notes;

        await _uow.SaveChangesAsync(ct);
        return await GetByIdUnscopedAsync(id, ct);
    }

    public async Task<InvoiceDto> AddPaymentAsync(int id, AddPaymentRequest request, CancellationToken ct = default)
    {
        var invoice = await _uow.Invoices.QueryTracked()
            .Include(i => i.Payments)
            .Include(i => i.Patient)
            .FirstOrDefaultAsync(i => i.Id == id, ct) ?? throw new NotFoundException("Invoice", id);

        if (invoice.Status is not (InvoiceStatus.Pending or InvoiceStatus.PartiallyPaid))
            throw new ConflictException($"Payments can only be recorded against pending or partially paid invoices (current status: {invoice.Status}).");

        var alreadyPaid = invoice.Payments.Sum(p => p.Amount);
        var balance = invoice.TotalAmount - alreadyPaid;

        if (request.Amount > balance)
            throw new BadRequestException($"Payment of {request.Amount:0.00} exceeds the outstanding balance of {balance:0.00}.");

        var payment = new Payment
        {
            InvoiceId = invoice.Id,
            ReceiptNumber = await GenerateReceiptNumberAsync(ct),
            Amount = request.Amount,
            Method = request.PaymentMethod,
            Notes = request.Notes,
            ReceivedByUserId = _currentUser.UserId ?? 0
        };
        invoice.Payments.Add(payment);

        var fullyPaid = alreadyPaid + request.Amount >= invoice.TotalAmount;
        invoice.Status = fullyPaid ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
        invoice.PaidAtUtc = fullyPaid ? DateTime.UtcNow : null;

        await _uow.SaveChangesAsync(ct);

        await _notifications.NotifyAsync(invoice.Patient.UserId, NotificationType.PaymentReceived,
            "Payment received",
            $"Payment of {request.Amount:0.00} received against invoice {invoice.InvoiceNumber} (receipt {payment.ReceiptNumber}). " +
            (fullyPaid ? "The invoice is now fully paid." : $"Outstanding balance: {invoice.TotalAmount - alreadyPaid - request.Amount:0.00}."), ct);

        return await GetByIdUnscopedAsync(id, ct);
    }

    public async Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(int id, CancellationToken ct = default)
    {
        var scoped = await ScopeToCurrentUserAsync(_uow.Invoices.Query(), ct);
        if (!await scoped.AnyAsync(i => i.Id == id, ct))
            throw new NotFoundException("Invoice", id);

        return await _uow.Payments.Query()
            .Where(p => p.InvoiceId == id)
            .OrderBy(p => p.Id)
            .Select(p => new PaymentDto(p.Id, p.ReceiptNumber, p.Amount, p.Method, p.Notes, p.CreatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<InvoiceDto> CancelAsync(int id, CancellationToken ct = default)
    {
        var invoice = await _uow.Invoices.QueryTracked()
            .FirstOrDefaultAsync(i => i.Id == id, ct) ?? throw new NotFoundException("Invoice", id);

        if (invoice.Status != InvoiceStatus.Pending)
            throw new ConflictException($"Only pending invoices can be cancelled (current status: {invoice.Status}).");

        invoice.Status = InvoiceStatus.Cancelled;
        await _uow.SaveChangesAsync(ct);

        return await GetByIdUnscopedAsync(id, ct);
    }

    private async Task<IQueryable<Invoice>> ScopeToCurrentUserAsync(IQueryable<Invoice> query, CancellationToken ct)
    {
        if (_currentUser.Role == UserRole.Patient)
        {
            var patientId = await _uow.Patients.Query()
                .Where(p => p.UserId == _currentUser.UserId)
                .Select(p => (int?)p.Id)
                .FirstOrDefaultAsync(ct);
            return query.Where(i => i.PatientId == (patientId ?? -1));
        }

        return query;
    }

    private async Task<string> GenerateInvoiceNumberAsync(CancellationToken ct)
    {
        var sequence = await _uow.Invoices.Query().CountAsync(ct) + 1;
        return $"INV-{DateTime.UtcNow.Year}-{sequence:D6}";
    }

    private async Task<string> GenerateReceiptNumberAsync(CancellationToken ct)
    {
        var sequence = await _uow.Payments.Query().CountAsync(ct) + 1;
        return $"RCP-{DateTime.UtcNow.Year}-{sequence:D6}";
    }

    private async Task<InvoiceDto> GetByIdUnscopedAsync(int id, CancellationToken ct)
    {
        return await _uow.Invoices.Query()
            .Where(i => i.Id == id)
            .Select(Projections.Invoice)
            .FirstAsync(ct);
    }
}
