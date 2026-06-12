using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;

namespace HAPM.Application.DTOs;

public class CreateReviewRequest
{
    [Required]
    public int AppointmentId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}

public class ReviewQueryParams : PaginationParams
{
    public int? DoctorId { get; set; }
    public int? MinRating { get; set; }
}

public record ReviewDto(
    int Id,
    int DoctorId,
    string DoctorName,
    int PatientId,
    string PatientName,
    int AppointmentId,
    int Rating,
    string? Comment,
    DateTime CreatedAtUtc);
