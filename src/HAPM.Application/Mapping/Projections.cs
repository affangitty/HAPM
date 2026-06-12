using System.Linq.Expressions;
using HAPM.Application.DTOs;
using HAPM.Domain.Entities;

namespace HAPM.Application.Mapping;

/// <summary>EF-translatable projection expressions shared across services.</summary>
public static class Projections
{
    public static readonly Expression<Func<User, UserDto>> User = u =>
        new UserDto(u.Id, u.Email, u.FullName, u.PhoneNumber, u.Role.ToString(), u.IsActive, u.CreatedAtUtc);

    public static readonly Expression<Func<Doctor, DoctorDto>> Doctor = d =>
        new DoctorDto(
            d.Id, d.UserId, d.User.FullName, d.User.Email, d.User.PhoneNumber,
            d.Specialization, d.Qualification, d.LicenseNumber, d.ExperienceYears,
            d.ConsultationFee, d.RoomNumber, d.Biography, d.IsAvailable, d.User.IsActive,
            d.Reviews.Average(r => (double?)r.Rating) ?? 0,
            d.Reviews.Count,
            d.Schedules
                .OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime)
                .Select(s => new DoctorScheduleDto(s.Id, s.DayOfWeek, s.StartTime, s.EndTime, s.SlotDurationMinutes))
                .ToList());

    public static readonly Expression<Func<Patient, PatientDto>> Patient = p =>
        new PatientDto(
            p.Id, p.UserId, p.MedicalRecordNumber, p.User.FullName, p.User.Email, p.User.PhoneNumber,
            p.DateOfBirth,
            DateTime.UtcNow.Year - p.DateOfBirth.Year,
            p.Gender, p.BloodGroup, p.Address,
            p.EmergencyContactName, p.EmergencyContactPhone, p.Allergies, p.ChronicConditions,
            p.User.IsActive, p.CreatedAtUtc);

    public static readonly Expression<Func<Appointment, AppointmentDto>> Appointment = a =>
        new AppointmentDto(
            a.Id,
            a.PatientId, a.Patient.User.FullName, a.Patient.MedicalRecordNumber,
            a.DoctorId, a.Doctor.User.FullName, a.Doctor.Specialization,
            a.AppointmentDate, a.StartTime, a.EndTime,
            a.Status, a.Reason, a.Notes, a.CancellationReason,
            a.Prescription != null, a.Invoice != null,
            a.CreatedAtUtc);

    public static readonly Expression<Func<Prescription, PrescriptionDto>> Prescription = p =>
        new PrescriptionDto(
            p.Id,
            p.AppointmentId, p.Appointment.AppointmentDate,
            p.DoctorId, p.Doctor.User.FullName, p.Doctor.Specialization,
            p.PatientId, p.Patient.User.FullName, p.Patient.MedicalRecordNumber,
            p.Diagnosis, p.Notes, p.FollowUpDate, p.CreatedAtUtc,
            p.Items
                .OrderBy(i => i.Id)
                .Select(i => new PrescriptionItemDto(i.Id, i.MedicineName, i.Dosage, i.Frequency, i.DurationDays, i.Instructions))
                .ToList());

    public static readonly Expression<Func<PrescriptionTemplate, PrescriptionTemplateDto>> PrescriptionTemplate = t =>
        new PrescriptionTemplateDto(
            t.Id, t.Name, t.Diagnosis, t.Notes, t.CreatedAtUtc, t.UpdatedAtUtc,
            t.Items
                .OrderBy(i => i.Id)
                .Select(i => new PrescriptionTemplateItemDto(i.Id, i.MedicineName, i.Dosage, i.Frequency, i.DurationDays, i.Instructions))
                .ToList());

    public static readonly Expression<Func<LabReport, LabReportDto>> LabReport = r =>
        new LabReportDto(
            r.Id,
            r.PatientId, r.Patient.User.FullName, r.Patient.MedicalRecordNumber,
            r.DoctorId, r.Doctor != null ? r.Doctor.User.FullName : null,
            r.AppointmentId,
            r.ReportType, r.Title, r.FileName, r.ContentType, r.FileSizeBytes,
            r.Status, r.ReviewRemarks, r.CreatedAtUtc);

    public static readonly Expression<Func<Invoice, InvoiceDto>> Invoice = i =>
        new InvoiceDto(
            i.Id, i.InvoiceNumber,
            i.PatientId, i.Patient.User.FullName, i.Patient.MedicalRecordNumber,
            i.AppointmentId,
            i.SubTotal, i.TaxPercent, i.TaxAmount, i.DiscountAmount, i.TotalAmount,
            i.Payments.Sum(p => (decimal?)p.Amount) ?? 0,
            i.TotalAmount - (i.Payments.Sum(p => (decimal?)p.Amount) ?? 0),
            i.Status, i.PaidAtUtc, i.Notes, i.CreatedAtUtc,
            i.Items
                .OrderBy(x => x.Id)
                .Select(x => new InvoiceItemDto(x.Id, x.Description, x.Quantity, x.UnitPrice, x.Amount))
                .ToList(),
            i.Payments
                .OrderBy(p => p.Id)
                .Select(p => new PaymentDto(p.Id, p.ReceiptNumber, p.Amount, p.Method, p.Notes, p.CreatedAtUtc))
                .ToList());

    public static readonly Expression<Func<Notification, NotificationDto>> Notification = n =>
        new NotificationDto(n.Id, n.Type, n.Title, n.Message, n.IsRead, n.CreatedAtUtc, n.ReadAtUtc);

    public static readonly Expression<Func<VitalSign, VitalSignDto>> VitalSign = v =>
        new VitalSignDto(
            v.Id, v.AppointmentId, v.PatientId, v.Patient.User.FullName,
            v.TemperatureCelsius, v.PulseBpm, v.RespiratoryRatePerMin,
            v.SystolicBpMmHg, v.DiastolicBpMmHg, v.OxygenSaturationPercent,
            v.HeightCm, v.WeightKg,
            v.HeightCm != null && v.WeightKg != null && v.HeightCm > 0
                ? Math.Round(v.WeightKg.Value / (v.HeightCm.Value / 100m * (v.HeightCm.Value / 100m)), 1)
                : null,
            v.Notes, v.CreatedAtUtc);

    public static readonly Expression<Func<DoctorLeave, DoctorLeaveDto>> DoctorLeave = l =>
        new DoctorLeaveDto(l.Id, l.DoctorId, l.Doctor.User.FullName, l.StartDate, l.EndDate, l.Reason, l.CreatedAtUtc);

    public static readonly Expression<Func<DoctorReview, ReviewDto>> Review = r =>
        new ReviewDto(
            r.Id, r.DoctorId, r.Doctor.User.FullName,
            r.PatientId, r.Patient.User.FullName,
            r.AppointmentId, r.Rating, r.Comment, r.CreatedAtUtc);

    public static readonly Expression<Func<WaitlistEntry, WaitlistEntryDto>> Waitlist = w =>
        new WaitlistEntryDto(
            w.Id, w.DoctorId, w.Doctor.User.FullName, w.Doctor.Specialization,
            w.PatientId, w.Patient.User.FullName,
            w.PreferredDate, w.Status, w.Notes, w.NotifiedAtUtc, w.CreatedAtUtc);

    public static readonly Expression<Func<AuditLog, AuditLogDto>> AuditLog = a =>
        new AuditLogDto(a.Id, a.UserId, a.UserEmail, a.EntityName, a.EntityId, a.Action, a.ChangesJson, a.CreatedAtUtc);
}
