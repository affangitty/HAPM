using HAPM.Application.Interfaces;
using HAPM.Application.Services;
using HAPM.Application.Realtime;
using Microsoft.Extensions.DependencyInjection;

namespace HAPM.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IDoctorService, DoctorService>();
        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IPrescriptionService, PrescriptionService>();
        services.AddScoped<ILabReportService, LabReportService>();
        services.AddScoped<IBillingService, BillingService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IVitalSignService, VitalSignService>();
        services.AddScoped<IDoctorLeaveService, DoctorLeaveService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IWaitlistService, WaitlistService>();
        services.AddScoped<IExportService, ExportService>();
        services.AddScoped<IPrescriptionTemplateService, PrescriptionTemplateService>();
        services.AddScoped<IStaffMessageService, StaffMessageService>();

        services.AddSingleton<IRealtimeNotificationDispatcher, NullRealtimeNotificationDispatcher>();
        services.AddSingleton<IAppointmentBoardDispatcher, NullAppointmentBoardDispatcher>();
        services.AddSingleton<IStaffMessageDispatcher, NullStaffMessageDispatcher>();

        return services;
    }
}
