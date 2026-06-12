using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _uow;

    public DashboardService(IUnitOfWork uow) => _uow = uow;

    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalDoctors = await _uow.Doctors.Query().CountAsync(d => d.User.IsActive, ct);
        var totalPatients = await _uow.Patients.Query().CountAsync(p => p.User.IsActive, ct);
        var totalAppointments = await _uow.Appointments.Query().CountAsync(ct);
        var appointmentsToday = await _uow.Appointments.Query()
            .CountAsync(a => a.AppointmentDate == today && a.Status != AppointmentStatus.Cancelled, ct);
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

        return new DashboardStatsDto(
            totalDoctors, totalPatients, totalAppointments, appointmentsToday,
            upcoming, pendingInvoices, totalRevenue, revenueThisMonth,
            byStatus, topSpecializations);
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
