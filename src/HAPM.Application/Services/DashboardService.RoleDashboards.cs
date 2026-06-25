using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public partial class DashboardService
{
    public async Task<DoctorRoleDashboardDto> GetDoctorDashboardAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var doctor = await _uow.Doctors.Query()
            .Where(d => d.UserId == userId)
            .Select(d => new { d.Id, d.User.FullName })
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("No doctor profile exists for the current user.");

        var today = HospitalClock.Today;
        var appointments = await _uow.Appointments.Query()
            .Where(a => a.DoctorId == doctor.Id && a.AppointmentDate == today)
            .OrderBy(a => a.StartTime)
            .Select(a => new
            {
                a.Id,
                a.StartTime,
                a.EndTime,
                Patient = a.Patient.User.FullName,
                a.Reason,
                a.Status,
            })
            .ToListAsync(ct);

        var seen = appointments.Count(a => a.Status == AppointmentStatus.Completed);
        var waiting = appointments.Count(a => a.Status == AppointmentStatus.CheckedIn);
        var cancelled = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);

        var pendingLabs = await _uow.LabReports.Query()
            .Where(r => r.DoctorId == doctor.Id && r.Status == LabReportStatus.Uploaded)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Take(5)
            .Select(r => new RoleDashboardAttentionDto(
                r.Id,
                r.Title,
                $"{r.Patient.User.FullName} · pending review",
                "PENDING",
                "danger"))
            .ToListAsync(ct);

        var notifications = await LoadNotificationsAsync(userId, ct);

        return new DoctorRoleDashboardDto(
            [
                new RoleDashboardKpiDto("Total Appts", appointments.Count.ToString(), "today"),
                new RoleDashboardKpiDto("Seen", seen.ToString(), "completed today"),
                new RoleDashboardKpiDto("Waiting", waiting.ToString(), "checked in"),
                new RoleDashboardKpiDto("Cancellations", cancelled.ToString(), "today"),
            ],
            appointments.Select(a => new RoleDashboardScheduleDto(
                a.Id,
                a.StartTime.ToString("HH:mm"),
                FormatDuration(a.StartTime, a.EndTime),
                a.Patient,
                a.Reason,
                a.Status.ToString(),
                a.Status == AppointmentStatus.CheckedIn)).ToList(),
            pendingLabs,
            notifications);
    }

    public async Task<PatientRoleDashboardDto> GetPatientDashboardAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var patient = await _uow.Patients.Query()
            .Where(p => p.UserId == userId)
            .Select(p => new { p.Id })
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("No patient profile exists for the current user.");

        var today = HospitalClock.Today;
        var upcoming = await _uow.Appointments.Query()
            .Where(a => a.PatientId == patient.Id && a.AppointmentDate >= today && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.AppointmentDate).ThenBy(a => a.StartTime)
            .Take(6)
            .Select(a => new RoleDashboardAppointmentDto(
                a.Id,
                a.Patient.User.FullName,
                a.Doctor.User.FullName,
                a.AppointmentDate.ToString("MMM dd, yyyy"),
                a.StartTime.ToString("HH:mm"),
                a.Reason,
                a.Status.ToString()))
            .ToListAsync(ct);

        var prescriptions = await _uow.Prescriptions.Query()
            .Where(p => p.PatientId == patient.Id)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Take(4)
            .Select(p => new RoleDashboardPrescriptionDto(
                p.Id,
                p.Doctor.User.FullName,
                p.CreatedAtUtc.ToString("MMM dd, yyyy"),
                "Active",
                p.Items.Select(i => new RoleDashboardMedicationDto(i.MedicineName, i.Dosage, i.Frequency)).ToList()))
            .ToListAsync(ct);

        var balanceRows = await _uow.Invoices.Query()
            .Where(i => i.PatientId == patient.Id && (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid))
            .Select(i => new
            {
                Balance = i.TotalAmount - (i.Payments.Sum(p => (decimal?)p.Amount) ?? 0),
                i.CreatedAtUtc,
            })
            .ToListAsync(ct);

        var balanceDue = balanceRows.Sum(b => b.Balance);
        var dueDate = balanceRows.OrderBy(b => b.CreatedAtUtc)
            .Select(b => b.CreatedAtUtc.AddDays(30).ToString("MMM dd, yyyy"))
            .FirstOrDefault();

        var latestVital = await _uow.VitalSigns.Query()
            .Where(v => v.PatientId == patient.Id)
            .OrderByDescending(v => v.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

        var vitals = latestVital is null
            ? Array.Empty<RoleDashboardVitalDto>()
            : new[]
            {
                new RoleDashboardVitalDto("Blood Pressure", $"{latestVital.SystolicBpMmHg}/{latestVital.DiastolicBpMmHg}", "mmHg", "normal"),
                new RoleDashboardVitalDto("Heart Rate", latestVital.PulseBpm?.ToString() ?? "—", "bpm", "normal"),
                new RoleDashboardVitalDto("Temperature", latestVital.TemperatureCelsius?.ToString("F1") ?? "—", "°C", "normal"),
            };

        var notifications = await LoadNotificationsAsync(userId, ct);

        return new PatientRoleDashboardDto(
            [
                new RoleDashboardKpiDto("Upcoming", upcoming.Count.ToString(), "appointments"),
                new RoleDashboardKpiDto("Prescriptions", prescriptions.Count.ToString(), "recent"),
                new RoleDashboardKpiDto("Balance Due", balanceDue.ToString("C"), "outstanding"),
            ],
            upcoming,
            prescriptions,
            balanceDue,
            dueDate,
            vitals,
            notifications);
    }

    public async Task<ReceptionistRoleDashboardDto> GetReceptionistDashboardAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var today = HospitalClock.Today;

        var queue = await _uow.Appointments.Query()
            .Where(a => a.AppointmentDate == today && a.Status == AppointmentStatus.CheckedIn)
            .OrderBy(a => a.StartTime)
            .Take(8)
            .Select(a => new RoleDashboardQueueDto(
                a.Id,
                a.Patient.User.FullName,
                a.StartTime.ToString("HH:mm"),
                a.Doctor.User.FullName,
                a.Status.ToString(),
                "—"))
            .ToListAsync(ct);

        var doctors = await _uow.Doctors.Query()
            .Where(d => d.User.IsActive)
            .OrderBy(d => d.User.FullName)
            .Take(6)
            .Select(d => new { d.Id, d.User.FullName, d.Specialization, d.RoomNumber, d.IsAvailable })
            .ToListAsync(ct);

        var rooms = doctors.Select(d => new RoleDashboardRoomDto(
            d.RoomNumber ?? $"DR-{d.Id}",
            d.RoomNumber ?? d.FullName,
            !d.IsAvailable,
            d.IsAvailable ? "Available" : "Busy")).ToList();

        var pendingInvoices = await _uow.Invoices.Query()
            .CountAsync(i => i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid, ct);
        var collectedToday = await _uow.Payments.Query()
            .Where(p => p.CreatedAtUtc >= today.ToDateTime(TimeOnly.MinValue))
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var notifications = await LoadNotificationsAsync(userId, ct);

        return new ReceptionistRoleDashboardDto(
            [
                new RoleDashboardKpiDto("Checked In", queue.Count.ToString(), "waiting now"),
                new RoleDashboardKpiDto("Pending Bills", pendingInvoices.ToString(), "invoices"),
                new RoleDashboardKpiDto("Collected Today", collectedToday.ToString("C"), "payments"),
            ],
            queue,
            rooms,
            [
                new RoleDashboardBillingMetricDto("Pending Invoices", pendingInvoices.ToString(), "awaiting payment", pendingInvoices > 5 ? "danger" : "default"),
                new RoleDashboardBillingMetricDto("Collected Today", collectedToday.ToString("C"), "cash & card", "success"),
            ],
            notifications);
    }

    private async Task<IReadOnlyList<RoleDashboardNotificationDto>> LoadNotificationsAsync(int userId, CancellationToken ct) =>
        await _uow.Notifications.Query()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(5)
            .Select(n => new RoleDashboardNotificationDto(
                n.Id, n.Type.ToString(), n.Title, n.Message, n.CreatedAtUtc, n.IsRead))
            .ToListAsync(ct);

    private static string FormatDuration(TimeOnly start, TimeOnly end)
    {
        var minutes = (int)(end.ToTimeSpan() - start.ToTimeSpan()).TotalMinutes;
        return minutes > 0 ? $"{minutes} min" : "30 min";
    }
}
