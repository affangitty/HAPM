using System.ComponentModel.DataAnnotations;

namespace HAPM.Application.DTOs;

public class CreateDoctorLeaveRequest
{
    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    [Required, MaxLength(300)]
    public string Reason { get; set; } = null!;
}

public record DoctorLeaveDto(
    int Id,
    int DoctorId,
    string DoctorName,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason,
    DateTime CreatedAtUtc);
