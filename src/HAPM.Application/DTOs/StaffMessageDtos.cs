using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class SendDoctorMessageRequest
{
    [Required]
    public int DoctorId { get; set; }

    [Required, MaxLength(2000)]
    public string Content { get; set; } = null!;
}

public class BroadcastStaffMessageRequest
{
    [Required, MaxLength(2000)]
    public string Content { get; set; } = null!;
}

public class StaffMessageQueryParams : PaginationParams
{
    public int? DoctorId { get; set; }
    public StaffMessageTarget? Target { get; set; }
}

public record StaffMessageDto(
    int Id,
    int SenderUserId,
    string SenderName,
    string SenderRole,
    StaffMessageTarget Target,
    int? DoctorId,
    string? DoctorName,
    string Content,
    DateTime CreatedAtUtc);
