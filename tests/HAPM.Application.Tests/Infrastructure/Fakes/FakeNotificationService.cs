using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Infrastructure.Fakes;

public sealed class FakeNotificationService : INotificationService
{
    public List<(int UserId, NotificationType Type, string Title, string Message)> Sent { get; } = new();

    public Task NotifyAsync(int userId, NotificationType type, string title, string message, CancellationToken ct = default)
    {
        Sent.Add((userId, type, title, message));
        return Task.CompletedTask;
    }

    public Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(
        PaginationParams query, bool unreadOnly, CancellationToken ct = default) =>
        Task.FromResult(new PagedResult<NotificationDto>());

    public Task<NotificationDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        Task.FromResult(new NotificationDto(id, NotificationType.General, "Test", "Test", false, DateTime.UtcNow, null));

    public Task<int> GetUnreadCountAsync(CancellationToken ct = default) =>
        Task.FromResult(0);

    public Task MarkAsReadAsync(int id, CancellationToken ct = default) =>
        Task.CompletedTask;

    public Task MarkAllAsReadAsync(CancellationToken ct = default) =>
        Task.CompletedTask;
}
