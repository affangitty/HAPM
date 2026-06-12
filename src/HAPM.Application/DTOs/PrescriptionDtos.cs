using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;

namespace HAPM.Application.DTOs;

public class PrescriptionItemRequest
{
    [Required, MaxLength(200)]
    public string MedicineName { get; set; } = null!;

    [Required, MaxLength(50)]
    public string Dosage { get; set; } = null!;

    [Required, MaxLength(50)]
    public string Frequency { get; set; } = null!;

    [Range(1, 365)]
    public int DurationDays { get; set; }

    [MaxLength(300)]
    public string? Instructions { get; set; }
}

public class CreatePrescriptionRequest
{
    [Required]
    public int AppointmentId { get; set; }

    [Required, MaxLength(1000)]
    public string Diagnosis { get; set; } = null!;

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public DateOnly? FollowUpDate { get; set; }

    [Required, MinLength(1)]
    public List<PrescriptionItemRequest> Items { get; set; } = new();
}

public class UpdatePrescriptionRequest
{
    [Required, MaxLength(1000)]
    public string Diagnosis { get; set; } = null!;

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public DateOnly? FollowUpDate { get; set; }

    [Required, MinLength(1)]
    public List<PrescriptionItemRequest> Items { get; set; } = new();
}

public class PrescriptionQueryParams : PaginationParams
{
    public int? PatientId { get; set; }
    public int? DoctorId { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
}

public record PrescriptionItemDto(int Id, string MedicineName, string Dosage, string Frequency, int DurationDays, string? Instructions);

public record PrescriptionDto(
    int Id,
    int AppointmentId,
    DateOnly AppointmentDate,
    int DoctorId,
    string DoctorName,
    string Specialization,
    int PatientId,
    string PatientName,
    string MedicalRecordNumber,
    string Diagnosis,
    string? Notes,
    DateOnly? FollowUpDate,
    DateTime CreatedAtUtc,
    IReadOnlyList<PrescriptionItemDto> Items);
