using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IRealtimeNotificationDispatcher _realtime;

    public NotificationService(
        IUnitOfWork uow,
        ICurrentUserService currentUser,
        IRealtimeNotificationDispatcher realtime)
    {
        _uow = uow;
        _currentUser = currentUser;
        _realtime = realtime;
    }

    public async Task NotifyAsync(int userId, NotificationType type, string title, string message, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message
        };

        await _uow.Notifications.AddAsync(notification, ct);
        await _uow.SaveChangesAsync(ct);

        var dto = await _uow.Notifications.Query()
            .Where(n => n.Id == notification.Id)
            .Select(Projections.Notification)
            .FirstAsync(ct);

        await _realtime.PushNotificationAsync(userId, dto, ct);
    }

    public async Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(PaginationParams query, bool unreadOnly, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();

        var notifications = _uow.Notifications.Query().Where(n => n.UserId == userId);

        if (unreadOnly)
            notifications = notifications.Where(n => !n.IsRead);

        return await notifications
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(Projections.Notification)
            .ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<NotificationDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();

        return await _uow.Notifications.Query()
            .Where(n => n.Id == id && n.UserId == userId)
            .Select(Projections.Notification)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Notification", id);
    }

    public async Task<int> GetUnreadCountAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        return await _uow.Notifications.Query().CountAsync(n => n.UserId == userId && !n.IsRead, ct);
    }

    public async Task MarkAsReadAsync(int id, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();

        var notification = await _uow.Notifications.QueryTracked()
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct)
            ?? throw new NotFoundException("Notification", id);

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAtUtc = DateTime.UtcNow;
            await _uow.SaveChangesAsync(ct);
        }
    }

    public async Task MarkAllAsReadAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();

        var unread = await _uow.Notifications.QueryTracked()
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);

        foreach (var notification in unread)
        {
            notification.IsRead = true;
            notification.ReadAtUtc = DateTime.UtcNow;
        }

        await _uow.SaveChangesAsync(ct);
    }
}
