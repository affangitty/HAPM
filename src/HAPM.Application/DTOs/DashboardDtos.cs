using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public record AppointmentsByStatusDto(AppointmentStatus Status, int Count);
public record SpecializationCountDto(string Specialization, int DoctorCount, int AppointmentCount);

public record SystemHealthMetricDto(string Label, string Value, string Tone, int? Progress = null);

public record DashboardStatsDto(
    int TotalDoctors,
    int TotalPatients,
    int TotalAppointments,
    int AppointmentsToday,
    int UpcomingAppointments,
    int PendingInvoices,
    decimal TotalRevenue,
    decimal RevenueThisMonth,
    decimal RevenueLastMonth,
    int AppointmentsYesterday,
    int NewPatientsThisMonth,
    int NewPatientsLastMonth,
    int PendingLabReviews,
    int ActiveWaitlistEntries,
    IReadOnlyList<AppointmentsByStatusDto> AppointmentsByStatus,
    IReadOnlyList<SpecializationCountDto> TopSpecializations,
    IReadOnlyList<SystemHealthMetricDto> SystemHealth);

/// <summary>One cell of the day-of-week × hour-of-day appointment heatmap.</summary>
public record PeakHourCellDto(DayOfWeek DayOfWeek, int Hour, int AppointmentCount);

public record SpecializationRevenueDto(string Specialization, int PaymentCount, decimal TotalRevenue);

public record RoleDashboardKpiDto(string Title, string Value, string Subtitle, string? Trend = null, string? TrendValue = null);

public record RoleDashboardScheduleDto(
    int Id, string Time, string Duration, string Patient, string Type, string Status, bool Highlight);

public record RoleDashboardAttentionDto(int Id, string Title, string Subtitle, string Status, string Tone);

public record RoleDashboardNotificationDto(
    int Id, string Type, string Title, string Message, DateTime CreatedAtUtc, bool IsRead);

public record RoleDashboardAppointmentDto(
    int Id, string Patient, string Doctor, string Date, string Time, string Type, string Status);

public record RoleDashboardPrescriptionDto(
    int Id, string Patient, string Date, string Status, IReadOnlyList<RoleDashboardMedicationDto> Medications);

public record RoleDashboardMedicationDto(string Name, string Dose, string Freq);

public record RoleDashboardQueueDto(
    int Id, string Name, string Time, string Doctor, string Status, string WaitTime);

public record RoleDashboardRoomDto(string Id, string Name, bool Occupied, string? Detail);

public record RoleDashboardBillingMetricDto(string Label, string Value, string Subtitle, string? Tone);

public record RoleDashboardVitalDto(string Label, string Value, string Unit, string Status);

public record DoctorRoleDashboardDto(
    IReadOnlyList<RoleDashboardKpiDto> Kpis,
    IReadOnlyList<RoleDashboardScheduleDto> Schedule,
    IReadOnlyList<RoleDashboardAttentionDto> AttentionItems,
    IReadOnlyList<RoleDashboardNotificationDto> Notifications);

public record PatientRoleDashboardDto(
    IReadOnlyList<RoleDashboardKpiDto> Kpis,
    IReadOnlyList<RoleDashboardAppointmentDto> UpcomingAppointments,
    IReadOnlyList<RoleDashboardPrescriptionDto> Prescriptions,
    decimal BalanceDue,
    string? BalanceDueDate,
    IReadOnlyList<RoleDashboardVitalDto> Vitals,
    IReadOnlyList<RoleDashboardNotificationDto> Notifications);

public record ReceptionistRoleDashboardDto(
    IReadOnlyList<RoleDashboardKpiDto> Kpis,
    IReadOnlyList<RoleDashboardQueueDto> Queue,
    IReadOnlyList<RoleDashboardRoomDto> Rooms,
    IReadOnlyList<RoleDashboardBillingMetricDto> BillingMetrics,
    IReadOnlyList<RoleDashboardNotificationDto> Notifications);

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
