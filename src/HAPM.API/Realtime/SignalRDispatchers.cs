using HAPM.API.Hubs;
using HAPM.API.Realtime;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Domain.Enums;
using Microsoft.AspNetCore.SignalR;

namespace HAPM.API.Realtime;

public sealed class SignalRNotificationDispatcher : IRealtimeNotificationDispatcher
{
    private readonly IHubContext<NotificationsHub> _hub;

    public SignalRNotificationDispatcher(IHubContext<NotificationsHub> hub) => _hub = hub;

    public Task PushNotificationAsync(int userId, NotificationDto notification, CancellationToken ct = default) =>
        _hub.Clients.Group(RealtimeGroups.ForUser(userId)).SendAsync("ReceiveNotification", notification, ct);
}

public sealed class SignalRAppointmentBoardDispatcher : IAppointmentBoardDispatcher
{
    private readonly IHubContext<AppointmentsHub> _hub;

    public SignalRAppointmentBoardDispatcher(IHubContext<AppointmentsHub> hub) => _hub = hub;

    public Task PublishStatusChangeAsync(AppointmentDto appointment, CancellationToken ct = default) =>
        _hub.Clients.Group(RealtimeGroups.StaffBoard).SendAsync("AppointmentStatusChanged", appointment, ct);
}

public sealed class SignalRStaffMessageDispatcher : IStaffMessageDispatcher
{
    private readonly IHubContext<ChatHub> _hub;

    public SignalRStaffMessageDispatcher(IHubContext<ChatHub> hub) => _hub = hub;

    public Task DeliverAsync(StaffMessageDto message, CancellationToken ct = default)
    {
        var targetGroup = message.Target switch
        {
            StaffMessageTarget.DoctorRoom when message.DoctorId.HasValue
                => RealtimeGroups.DoctorRoom(message.DoctorId.Value),
            StaffMessageTarget.StaffBroadcast => RealtimeGroups.StaffBroadcast,
            _ => RealtimeGroups.StaffBroadcast
        };

        return _hub.Clients.Group(targetGroup).SendAsync("ReceiveStaffMessage", message, ct);
    }
}
