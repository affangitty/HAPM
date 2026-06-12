using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public record NotificationDto(
    int Id,
    NotificationType Type,
    string Title,
    string Message,
    bool IsRead,
    DateTime CreatedAtUtc,
    DateTime? ReadAtUtc);
