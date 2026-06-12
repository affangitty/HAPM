using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;
using HAPM.Application.Validation;

namespace HAPM.Application.DTOs;

public class CreateDoctorRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = null!;

    [Required, StrongPassword, MaxLength(100)]
    public string Password { get; set; } = null!;

    [Required, MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required, Phone, MaxLength(20)]
    public string PhoneNumber { get; set; } = null!;

    [Required, MaxLength(100)]
    public string Specialization { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Qualification { get; set; } = null!;

    [Required, MaxLength(50)]
    public string LicenseNumber { get; set; } = null!;

    [Range(0, 80)]
    public int ExperienceYears { get; set; }

    [Range(0, 1_000_000)]
    public decimal ConsultationFee { get; set; }

    [MaxLength(20)]
    public string? RoomNumber { get; set; }

    [MaxLength(2000)]
    public string? Biography { get; set; }
}

public class UpdateDoctorRequest
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required, Phone, MaxLength(20)]
    public string PhoneNumber { get; set; } = null!;

    [Required, MaxLength(100)]
    public string Specialization { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Qualification { get; set; } = null!;

    [Range(0, 80)]
    public int ExperienceYears { get; set; }

    [Range(0, 1_000_000)]
    public decimal ConsultationFee { get; set; }

    [MaxLength(20)]
    public string? RoomNumber { get; set; }

    [MaxLength(2000)]
    public string? Biography { get; set; }

    public bool IsAvailable { get; set; } = true;
}

/// <summary>Fields a doctor may change on their own profile (admin controls the rest).</summary>
public class UpdateOwnDoctorProfileRequest
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required, Phone, MaxLength(20)]
    public string PhoneNumber { get; set; } = null!;

    [MaxLength(20)]
    public string? RoomNumber { get; set; }

    [MaxLength(2000)]
    public string? Biography { get; set; }
}

public class DoctorQueryParams : PaginationParams
{
    public string? Specialization { get; set; }
    public bool? IsAvailable { get; set; }
}

public class ScheduleSlotRequest
{
    [Required]
    public DayOfWeek DayOfWeek { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required]
    public TimeOnly EndTime { get; set; }

    [Range(5, 240)]
    public int SlotDurationMinutes { get; set; } = 30;
}

public record DoctorScheduleDto(int Id, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, int SlotDurationMinutes);

public record DoctorDto(
    int Id,
    int UserId,
    string FullName,
    string Email,
    string? PhoneNumber,
    string Specialization,
    string Qualification,
    string LicenseNumber,
    int ExperienceYears,
    decimal ConsultationFee,
    string? RoomNumber,
    string? Biography,
    bool IsAvailable,
    bool IsActive,
    double AverageRating,
    int ReviewCount,
    IReadOnlyList<DoctorScheduleDto> Schedules);

public record AvailableSlotDto(TimeOnly StartTime, TimeOnly EndTime);
