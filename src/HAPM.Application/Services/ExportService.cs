using System.Text;
using HAPM.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class ExportService : IExportService
{
    private readonly IUnitOfWork _uow;

    public ExportService(IUnitOfWork uow) => _uow = uow;

    public async Task<CsvExport> ExportAppointmentsAsync(DateOnly? fromDate, DateOnly? toDate, CancellationToken ct = default)
    {
        var query = _uow.Appointments.Query();
        if (fromDate.HasValue) query = query.Where(a => a.AppointmentDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(a => a.AppointmentDate <= toDate.Value);

        var rows = await query
            .OrderBy(a => a.AppointmentDate).ThenBy(a => a.StartTime)
            .Select(a => new
            {
                a.Id,
                Date = a.AppointmentDate,
                Start = a.StartTime,
                End = a.EndTime,
                Status = a.Status.ToString(),
                PatientMrn = a.Patient.MedicalRecordNumber,
                PatientName = a.Patient.User.FullName,
                DoctorName = a.Doctor.User.FullName,
                a.Doctor.Specialization,
                a.Reason,
                a.CreatedAtUtc
            })
            .ToListAsync(ct);

        var csv = BuildCsv(
            new[] { "Id", "Date", "StartTime", "EndTime", "Status", "PatientMRN", "PatientName", "DoctorName", "Specialization", "Reason", "CreatedAtUtc" },
            rows.Select(r => new object?[]
            {
                r.Id, r.Date.ToString("yyyy-MM-dd"), r.Start.ToString("HH:mm"), r.End.ToString("HH:mm"),
                r.Status, r.PatientMrn, r.PatientName, r.DoctorName, r.Specialization, r.Reason,
                r.CreatedAtUtc.ToString("u")
            }));

        return new CsvExport(csv, $"appointments-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv");
    }

    public async Task<CsvExport> ExportPatientsAsync(CancellationToken ct = default)
    {
        var rows = await _uow.Patients.Query()
            .OrderBy(p => p.Id)
            .Select(p => new
            {
                p.Id,
                p.MedicalRecordNumber,
                p.User.FullName,
                p.User.Email,
                p.User.PhoneNumber,
                p.DateOfBirth,
                Gender = p.Gender.ToString(),
                p.BloodGroup,
                p.User.IsActive,
                RegisteredAtUtc = p.CreatedAtUtc
            })
            .ToListAsync(ct);

        var csv = BuildCsv(
            new[] { "Id", "MRN", "FullName", "Email", "Phone", "DateOfBirth", "Gender", "BloodGroup", "IsActive", "RegisteredAtUtc" },
            rows.Select(r => new object?[]
            {
                r.Id, r.MedicalRecordNumber, r.FullName, r.Email, r.PhoneNumber,
                r.DateOfBirth.ToString("yyyy-MM-dd"), r.Gender, r.BloodGroup, r.IsActive,
                r.RegisteredAtUtc.ToString("u")
            }));

        return new CsvExport(csv, $"patients-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv");
    }

    public async Task<CsvExport> ExportInvoicesAsync(DateOnly? fromDate, DateOnly? toDate, CancellationToken ct = default)
    {
        var query = _uow.Invoices.Query();
        if (fromDate.HasValue)
        {
            var from = fromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(i => i.CreatedAtUtc >= from);
        }
        if (toDate.HasValue)
        {
            var to = toDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(i => i.CreatedAtUtc < to);
        }

        var rows = await query
            .OrderBy(i => i.Id)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                PatientMrn = i.Patient.MedicalRecordNumber,
                PatientName = i.Patient.User.FullName,
                Status = i.Status.ToString(),
                i.SubTotal,
                i.TaxAmount,
                i.DiscountAmount,
                i.TotalAmount,
                AmountPaid = i.Payments.Sum(p => (decimal?)p.Amount) ?? 0,
                i.CreatedAtUtc,
                i.PaidAtUtc
            })
            .ToListAsync(ct);

        var csv = BuildCsv(
            new[] { "Id", "InvoiceNumber", "PatientMRN", "PatientName", "Status", "SubTotal", "Tax", "Discount", "Total", "AmountPaid", "CreatedAtUtc", "PaidAtUtc" },
            rows.Select(r => new object?[]
            {
                r.Id, r.InvoiceNumber, r.PatientMrn, r.PatientName, r.Status,
                r.SubTotal, r.TaxAmount, r.DiscountAmount, r.TotalAmount, r.AmountPaid,
                r.CreatedAtUtc.ToString("u"), r.PaidAtUtc?.ToString("u")
            }));

        return new CsvExport(csv, $"invoices-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv");
    }

    private static byte[] BuildCsv(string[] headers, IEnumerable<object?[]> rows)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(',', headers.Select(Escape)));

        foreach (var row in rows)
            sb.AppendLine(string.Join(',', row.Select(v => Escape(v?.ToString() ?? string.Empty))));

        // UTF-8 BOM so Excel detects the encoding correctly.
        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    private static string Escape(string value) =>
        value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r')
            ? $"\"{value.Replace("\"", "\"\"")}\""
            : value;
}
