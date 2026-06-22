using HAPM.API.Hubs;
using HAPM.API.Realtime;
using HAPM.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace HAPM.API;

public static class SignalRDependencyInjection
{
    public static IServiceCollection AddHapmSignalR(this IServiceCollection services)
    {
        services.AddSignalR();

        services.RemoveAll<IRealtimeNotificationDispatcher>();
        services.RemoveAll<IAppointmentBoardDispatcher>();
        services.RemoveAll<IStaffMessageDispatcher>();

        services.AddSingleton<IRealtimeNotificationDispatcher, SignalRNotificationDispatcher>();
        services.AddSingleton<IAppointmentBoardDispatcher, SignalRAppointmentBoardDispatcher>();
        services.AddSingleton<IStaffMessageDispatcher, SignalRStaffMessageDispatcher>();

        return services;
    }

    public static WebApplication MapHapmHubs(this WebApplication app)
    {
        app.MapHub<NotificationsHub>("/hubs/notifications");
        app.MapHub<AppointmentsHub>("/hubs/appointments");
        app.MapHub<ChatHub>("/hubs/chat");
        return app;
    }
}
