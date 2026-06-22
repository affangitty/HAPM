using HAPM.Application.DTOs;

namespace HAPM.Application.Interfaces;

/// <summary>Pushes persisted notifications to connected clients (SignalR).</summary>
public interface IRealtimeNotificationDispatcher
{
    Task PushNotificationAsync(int userId, NotificationDto notification, CancellationToken ct = default);
}

/// <summary>Pushes appointment status changes to the receptionist/admin live board.</summary>
public interface IAppointmentBoardDispatcher
{
    Task PublishStatusChangeAsync(AppointmentDto appointment, CancellationToken ct = default);
}

/// <summary>Pushes staff internal messages to hub room groups.</summary>
public interface IStaffMessageDispatcher
{
    Task DeliverAsync(StaffMessageDto message, CancellationToken ct = default);
}
