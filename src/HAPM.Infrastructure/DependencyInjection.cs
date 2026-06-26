using HAPM.Application.Configuration;
using HAPM.Application.Interfaces;
using HAPM.Infrastructure.Auditing;
using HAPM.Infrastructure.Auth;
using HAPM.Infrastructure.BackgroundJobs;
using HAPM.Infrastructure.Email;
using HAPM.Infrastructure.Persistence;
using HAPM.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HAPM.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<AuditSaveChangesInterceptor>();

        services.AddDbContext<AppDbContext>((provider, options) => options
            .UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
            .AddInterceptors(provider.GetRequiredService<AuditSaveChangesInterceptor>()));

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.Configure<FrontendSettings>(configuration.GetSection(FrontendSettings.SectionName));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<ITokenHasher, Sha256TokenHasher>();
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddSingleton<IFileStorageService, LocalFileStorageService>();
        services.AddHostedService<AppointmentReminderService>();

        return services;
    }
}
