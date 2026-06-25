using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService) => _notificationService = notificationService;

    /// <summary>The signed-in user's notifications, newest first.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<NotificationDto>>> GetMine([FromQuery] PaginationParams query, [FromQuery] bool unreadOnly, CancellationToken ct) =>
        Ok(await _notificationService.GetMyNotificationsAsync(query, unreadOnly, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<NotificationDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _notificationService.GetByIdAsync(id, ct));

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount(CancellationToken ct) =>
        Ok(await _notificationService.GetUnreadCountAsync(ct));

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken ct)
    {
        await _notificationService.MarkAsReadAsync(id, ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        await _notificationService.MarkAllAsReadAsync(ct);
        return NoContent();
    }
}
