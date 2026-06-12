using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public record AppointmentsByStatusDto(AppointmentStatus Status, int Count);
public record SpecializationCountDto(string Specialization, int DoctorCount, int AppointmentCount);

public record DashboardStatsDto(
    int TotalDoctors,
    int TotalPatients,
    int TotalAppointments,
    int AppointmentsToday,
    int UpcomingAppointments,
    int PendingInvoices,
    decimal TotalRevenue,
    decimal RevenueThisMonth,
    IReadOnlyList<AppointmentsByStatusDto> AppointmentsByStatus,
    IReadOnlyList<SpecializationCountDto> TopSpecializations);

/// <summary>One cell of the day-of-week × hour-of-day appointment heatmap.</summary>
public record PeakHourCellDto(DayOfWeek DayOfWeek, int Hour, int AppointmentCount);

public record SpecializationRevenueDto(string Specialization, int PaymentCount, decimal TotalRevenue);

public record DoctorPerformanceDto(
    int DoctorId,
    string DoctorName,
    string Specialization,
    int TotalAppointments,
    int CompletedAppointments,
    int CancelledAppointments,
    int NoShowAppointments,
    double NoShowRatePercent,
    double AverageRating,
    int ReviewCount,
    int PrescriptionCount,
    int DistinctPatients,
    decimal TotalRevenue);
