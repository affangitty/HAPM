using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;

    public PrescriptionService(IUnitOfWork uow, ICurrentUserService currentUser, INotificationService notifications)
    {
        _uow = uow;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    public async Task<PagedResult<PrescriptionDto>> GetPagedAsync(PrescriptionQueryParams query, CancellationToken ct = default)
    {
        var prescriptions = await ScopeToCurrentUserAsync(_uow.Prescriptions.Query(), ct);

        if (query.PatientId.HasValue)
            prescriptions = prescriptions.Where(p => p.PatientId == query.PatientId.Value);

        if (query.DoctorId.HasValue)
            prescriptions = prescriptions.Where(p => p.DoctorId == query.DoctorId.Value);

        if (query.FromDate.HasValue)
            prescriptions = prescriptions.Where(p => p.Appointment.AppointmentDate >= query.FromDate.Value);

        if (query.ToDate.HasValue)
            prescriptions = prescriptions.Where(p => p.Appointment.AppointmentDate <= query.ToDate.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            prescriptions = prescriptions.Where(p =>
                p.Diagnosis.ToLower().Contains(term) ||
                p.Patient.User.FullName.ToLower().Contains(term) ||
                p.Patient.MedicalRecordNumber.ToLower().Contains(term) ||
                p.Items.Any(i => i.MedicineName.ToLower().Contains(term)));
        }

        prescriptions = query.SortDescending
            ? prescriptions.OrderBy(p => p.CreatedAtUtc)
            : prescriptions.OrderByDescending(p => p.CreatedAtUtc);

        return await prescriptions.Select(Projections.Prescription).ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<PrescriptionDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var scoped = await ScopeToCurrentUserAsync(_uow.Prescriptions.Query(), ct);
        return await scoped
            .Where(p => p.Id == id)
            .Select(Projections.Prescription)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Prescription", id);
    }

    public async Task<PrescriptionDto> GetByAppointmentAsync(int appointmentId, CancellationToken ct = default)
    {
        var scoped = await ScopeToCurrentUserAsync(_uow.Prescriptions.Query(), ct);
        return await scoped
            .Where(p => p.AppointmentId == appointmentId)
            .Select(Projections.Prescription)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException($"No prescription exists for appointment '{appointmentId}'.");
    }

    public async Task<PrescriptionDto> CreateAsync(CreatePrescriptionRequest request, CancellationToken ct = default)
    {
        var doctor = await GetCurrentDoctorAsync(ct);

        var appointment = await _uow.Appointments.Query()
            .Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, ct)
            ?? throw new NotFoundException("Appointment", request.AppointmentId);

        if (appointment.DoctorId != doctor.Id)
            throw new ForbiddenException("You can only prescribe for your own appointments.");

        if (appointment.Status is not (AppointmentStatus.CheckedIn or AppointmentStatus.Completed))
            throw new ConflictException("Prescriptions can only be issued for checked-in or completed appointments.");

        if (await _uow.Prescriptions.Query().AnyAsync(p => p.AppointmentId == request.AppointmentId, ct))
            throw new ConflictException("A prescription already exists for this appointment. Update it instead.");

        var prescription = new Prescription
        {
            AppointmentId = appointment.Id,
            DoctorId = doctor.Id,
            PatientId = appointment.PatientId,
            Diagnosis = request.Diagnosis.Trim(),
            Notes = request.Notes,
            FollowUpDate = request.FollowUpDate,
            Items = request.Items.Select(ToItem).ToList()
        };

        await _uow.Prescriptions.AddAsync(prescription, ct);
        await _uow.SaveChangesAsync(ct);

        await _notifications.NotifyAsync(appointment.Patient.UserId, NotificationType.PrescriptionIssued,
            "Prescription issued", $"A prescription with {prescription.Items.Count} medicine(s) was issued for your appointment on {appointment.AppointmentDate:yyyy-MM-dd}.", ct);

        return await GetByIdUnscopedAsync(prescription.Id, ct);
    }

    public async Task<PrescriptionDto> UpdateAsync(int id, UpdatePrescriptionRequest request, CancellationToken ct = default)
    {
        var doctor = await GetCurrentDoctorAsync(ct);

        var prescription = await _uow.Prescriptions.QueryTracked()
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("Prescription", id);

        if (prescription.DoctorId != doctor.Id && _currentUser.Role != UserRole.Admin)
            throw new ForbiddenException("Only the prescribing doctor can update this prescription.");

        prescription.Diagnosis = request.Diagnosis.Trim();
        prescription.Notes = request.Notes;
        prescription.FollowUpDate = request.FollowUpDate;

        prescription.Items.Clear();
        foreach (var item in request.Items.Select(ToItem))
            prescription.Items.Add(item);

        await _uow.SaveChangesAsync(ct);
        return await GetByIdUnscopedAsync(id, ct);
    }

    // ---- helpers -------------------------------------------------------

    private static PrescriptionItem ToItem(PrescriptionItemRequest request) => new()
    {
        MedicineName = request.MedicineName.Trim(),
        Dosage = request.Dosage.Trim(),
        Frequency = request.Frequency.Trim(),
        DurationDays = request.DurationDays,
        Instructions = request.Instructions
    };

    private async Task<Doctor> GetCurrentDoctorAsync(CancellationToken ct)
    {
        if (_currentUser.Role != UserRole.Doctor)
            throw new ForbiddenException("Only doctors can manage prescriptions.");

        return await _uow.Doctors.Query()
            .FirstOrDefaultAsync(d => d.UserId == _currentUser.UserId, ct)
            ?? throw new NotFoundException("No doctor profile exists for the current user.");
    }

    private async Task<IQueryable<Prescription>> ScopeToCurrentUserAsync(IQueryable<Prescription> query, CancellationToken ct)
    {
        switch (_currentUser.Role)
        {
            case UserRole.Patient:
            {
                var patientId = await _uow.Patients.Query()
                    .Where(p => p.UserId == _currentUser.UserId)
                    .Select(p => (int?)p.Id)
                    .FirstOrDefaultAsync(ct);
                return query.Where(p => p.PatientId == (patientId ?? -1));
            }
            case UserRole.Doctor:
            {
                var doctorId = await _uow.Doctors.Query()
                    .Where(d => d.UserId == _currentUser.UserId)
                    .Select(d => (int?)d.Id)
                    .FirstOrDefaultAsync(ct);
                return query.Where(p => p.DoctorId == (doctorId ?? -1));
            }
            default:
                return query;
        }
    }

    private async Task<PrescriptionDto> GetByIdUnscopedAsync(int id, CancellationToken ct)
    {
        return await _uow.Prescriptions.Query()
            .Where(p => p.Id == id)
            .Select(Projections.Prescription)
            .FirstAsync(ct);
    }
}
