using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class BookAppointmentRequest
{
    [Required]
    public int DoctorId { get; set; }

    /// <summary>Required for Admin/Receptionist; ignored for Patient (their own profile is used).</summary>
    public int? PatientId { get; set; }

    [Required]
    public DateOnly AppointmentDate { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required, MaxLength(500)]
    public string Reason { get; set; } = null!;
}

public class RescheduleAppointmentRequest
{
    [Required]
    public DateOnly AppointmentDate { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }
}

public class CancelAppointmentRequest
{
    [Required, MaxLength(500)]
    public string Reason { get; set; } = null!;
}

public class CompleteAppointmentRequest
{
    [MaxLength(2000)]
    public string? Notes { get; set; }
}

public class AppointmentQueryParams : PaginationParams
{
    public int? DoctorId { get; set; }
    public int? PatientId { get; set; }
    public AppointmentStatus? Status { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
}

public record AppointmentDto(
    int Id,
    int PatientId,
    string PatientName,
    string MedicalRecordNumber,
    int DoctorId,
    string DoctorName,
    string Specialization,
    DateOnly AppointmentDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    AppointmentStatus Status,
    string Reason,
    string? Notes,
    string? CancellationReason,
    bool HasPrescription,
    bool HasInvoice,
    DateTime CreatedAtUtc);
