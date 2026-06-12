using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class JoinWaitlistRequest
{
    [Required]
    public int DoctorId { get; set; }

    /// <summary>Required for Admin/Receptionist; ignored for Patient (their own profile is used).</summary>
    public int? PatientId { get; set; }

    [Required]
    public DateOnly PreferredDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class WaitlistQueryParams : PaginationParams
{
    public int? DoctorId { get; set; }
    public DateOnly? PreferredDate { get; set; }
    public WaitlistStatus? Status { get; set; }
}

public record WaitlistEntryDto(
    int Id,
    int DoctorId,
    string DoctorName,
    string Specialization,
    int PatientId,
    string PatientName,
    DateOnly PreferredDate,
    WaitlistStatus Status,
    string? Notes,
    DateTime? NotifiedAtUtc,
    DateTime CreatedAtUtc);
