using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;
using HAPM.Application.Validation;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class CreatePatientRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = null!;

    [Required, StrongPassword, MaxLength(100)]
    public string Password { get; set; } = null!;

    [Required, MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required, Phone, MaxLength(20)]
    public string PhoneNumber { get; set; } = null!;

    [Required]
    public DateOnly DateOfBirth { get; set; }

    [Required]
    public Gender Gender { get; set; }

    [MaxLength(10)]
    public string? BloodGroup { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(150)]
    public string? EmergencyContactName { get; set; }

    [Phone, MaxLength(20)]
    public string? EmergencyContactPhone { get; set; }

    [MaxLength(1000)]
    public string? Allergies { get; set; }

    [MaxLength(1000)]
    public string? ChronicConditions { get; set; }
}

public class UpdatePatientRequest
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required, Phone, MaxLength(20)]
    public string PhoneNumber { get; set; } = null!;

    [Required]
    public DateOnly DateOfBirth { get; set; }

    [Required]
    public Gender Gender { get; set; }

    [MaxLength(10)]
    public string? BloodGroup { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(150)]
    public string? EmergencyContactName { get; set; }

    [Phone, MaxLength(20)]
    public string? EmergencyContactPhone { get; set; }

    [MaxLength(1000)]
    public string? Allergies { get; set; }

    [MaxLength(1000)]
    public string? ChronicConditions { get; set; }
}

public class PatientQueryParams : PaginationParams
{
    public Gender? Gender { get; set; }
    public string? BloodGroup { get; set; }
}

public record PatientDto(
    int Id,
    int UserId,
    string MedicalRecordNumber,
    string FullName,
    string Email,
    string? PhoneNumber,
    DateOnly DateOfBirth,
    int Age,
    Gender Gender,
    string? BloodGroup,
    string? Address,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    string? Allergies,
    string? ChronicConditions,
    bool IsActive,
    DateTime RegisteredAtUtc);

public record PatientMedicalHistoryDto(
    PatientDto Patient,
    IReadOnlyList<AppointmentDto> Appointments,
    IReadOnlyList<PrescriptionDto> Prescriptions,
    IReadOnlyList<LabReportDto> LabReports);
