using HAPM.API.Realtime;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HAPM.API.Hubs;

/// <summary>
/// Delivers persisted in-app notifications to connected clients in real time.
/// Clients join group <c>user-{userId}</c> automatically on connect.
/// </summary>
[Authorize]
public class NotificationsHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.GetUserId();
        if (userId.HasValue)
            await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.ForUser(userId.Value));

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.GetUserId();
        if (userId.HasValue)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeGroups.ForUser(userId.Value));

        await base.OnDisconnectedAsync(exception);
    }
}
