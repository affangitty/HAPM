using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;

namespace HAPM.Application.Realtime;

public sealed class NullRealtimeNotificationDispatcher : IRealtimeNotificationDispatcher
{
    public Task PushNotificationAsync(int userId, NotificationDto notification, CancellationToken ct = default) =>
        Task.CompletedTask;
}

public sealed class NullAppointmentBoardDispatcher : IAppointmentBoardDispatcher
{
    public Task PublishStatusChangeAsync(AppointmentDto appointment, CancellationToken ct = default) =>
        Task.CompletedTask;
}

public sealed class NullStaffMessageDispatcher : IStaffMessageDispatcher
{
    public Task DeliverAsync(StaffMessageDto message, CancellationToken ct = default) =>
        Task.CompletedTask;
}
