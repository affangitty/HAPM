using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public partial class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public DashboardService(IUnitOfWork uow, ICurrentUserService currentUser)
    {
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var yesterday = today.AddDays(-1);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var lastMonthStart = monthStart.AddMonths(-1);

        var totalDoctors = await _uow.Doctors.Query().CountAsync(d => d.User.IsActive, ct);
        var totalPatients = await _uow.Patients.Query().CountAsync(p => p.User.IsActive, ct);
        var totalAppointments = await _uow.Appointments.Query().CountAsync(ct);
        var appointmentsToday = await _uow.Appointments.Query()
            .CountAsync(a => a.AppointmentDate == today && a.Status != AppointmentStatus.Cancelled, ct);
        var appointmentsYesterday = await _uow.Appointments.Query()
            .CountAsync(a => a.AppointmentDate == yesterday && a.Status != AppointmentStatus.Cancelled, ct);
        var upcoming = await _uow.Appointments.Query()
            .CountAsync(a => a.AppointmentDate >= today &&
                             (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed), ct);
        var pendingInvoices = await _uow.Invoices.Query()
            .CountAsync(i => i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid, ct);

        // Revenue is money actually received (payments), not invoice face value.
        var totalRevenue = await _uow.Payments.Query()
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var revenueThisMonth = await _uow.Payments.Query()
            .Where(p => p.CreatedAtUtc >= monthStart)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var revenueLastMonth = await _uow.Payments.Query()
            .Where(p => p.CreatedAtUtc >= lastMonthStart && p.CreatedAtUtc < monthStart)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var newPatientsThisMonth = await _uow.Patients.Query()
            .CountAsync(p => p.CreatedAtUtc >= monthStart, ct);
        var newPatientsLastMonth = await _uow.Patients.Query()
            .CountAsync(p => p.CreatedAtUtc >= lastMonthStart && p.CreatedAtUtc < monthStart, ct);

        var pendingLabReviews = await _uow.LabReports.Query()
            .CountAsync(r => r.Status == LabReportStatus.Uploaded, ct);
        var activeWaitlist = await _uow.WaitlistEntries.Query()
            .CountAsync(w => w.Status == WaitlistStatus.Active, ct);

        var byStatus = await _uow.Appointments.Query()
            .GroupBy(a => a.Status)
            .Select(g => new AppointmentsByStatusDto(g.Key, g.Count()))
            .ToListAsync(ct);

        var doctorsBySpecialization = await _uow.Doctors.Query()
            .GroupBy(d => d.Specialization)
            .Select(g => new { Specialization = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var appointmentsBySpecialization = await _uow.Appointments.Query()
            .GroupBy(a => a.Doctor.Specialization)
            .Select(g => new { Specialization = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var topSpecializations = doctorsBySpecialization
            .Select(d => new SpecializationCountDto(
                d.Specialization,
                d.Count,
                appointmentsBySpecialization.FirstOrDefault(a => a.Specialization == d.Specialization)?.Count ?? 0))
            .OrderByDescending(s => s.AppointmentCount)
            .ThenByDescending(s => s.DoctorCount)
            .Take(5)
            .ToList();

        var systemHealth = new List<SystemHealthMetricDto>
        {
            new("Active Doctors", $"{totalDoctors} on roster", "success"),
            new("Pending Invoices", pendingInvoices.ToString(), pendingInvoices > 10 ? "danger" : "default", Math.Min(pendingInvoices, 100)),
            new("Lab Reviews", pendingLabReviews.ToString(), pendingLabReviews > 0 ? "danger" : "success"),
            new("Waitlist", activeWaitlist.ToString(), activeWaitlist > 5 ? "default" : "success"),
        };

        return new DashboardStatsDto(
            totalDoctors, totalPatients, totalAppointments, appointmentsToday,
            upcoming, pendingInvoices, totalRevenue, revenueThisMonth,
            revenueLastMonth, appointmentsYesterday, newPatientsThisMonth, newPatientsLastMonth,
            pendingLabReviews, activeWaitlist,
            byStatus, topSpecializations, systemHealth);
    }

    public async Task<IReadOnlyList<PeakHourCellDto>> GetPeakHoursAsync(
        DateOnly? fromDate, DateOnly? toDate, CancellationToken ct = default)
    {
        var appointments = _uow.Appointments.Query()
            .Where(a => a.Status != AppointmentStatus.Cancelled);

        if (fromDate.HasValue)
            appointments = appointments.Where(a => a.AppointmentDate >= fromDate.Value);

        if (toDate.HasValue)
            appointments = appointments.Where(a => a.AppointmentDate <= toDate.Value);

        // Group by raw columns in SQL; derive day-of-week × hour in memory
        // (DayOfWeek/Hour on DateOnly/TimeOnly are not reliably SQL-translatable).
        var grouped = await appointments
            .GroupBy(a => new { a.AppointmentDate, a.StartTime })
            .Select(g => new { g.Key.AppointmentDate, g.Key.StartTime, Count = g.Count() })
            .ToListAsync(ct);

        return grouped
            .GroupBy(g => new { g.AppointmentDate.DayOfWeek, g.StartTime.Hour })
            .Select(g => new PeakHourCellDto(g.Key.DayOfWeek, g.Key.Hour, g.Sum(x => x.Count)))
            .OrderBy(c => c.DayOfWeek)
            .ThenBy(c => c.Hour)
            .ToList();
    }

    public async Task<IReadOnlyList<SpecializationRevenueDto>> GetRevenueBySpecializationAsync(CancellationToken ct = default)
    {
        var rows = await _uow.Payments.Query()
            .GroupBy(p => p.Invoice.Appointment != null
                ? p.Invoice.Appointment.Doctor.Specialization
                : "Other")
            .Select(g => new SpecializationRevenueDto(g.Key, g.Count(), g.Sum(p => p.Amount)))
            .ToListAsync(ct);

        return rows.OrderByDescending(r => r.TotalRevenue).ToList();
    }
}
