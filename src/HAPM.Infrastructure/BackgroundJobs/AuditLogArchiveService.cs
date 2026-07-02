using HAPM.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HAPM.Infrastructure.BackgroundJobs;

/// <summary>Moves aged audit logs to cold storage and purges very old archives.</summary>
public class AuditLogArchiveService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditLogArchiveService> _logger;

    public AuditLogArchiveService(IServiceScopeFactory scopeFactory, ILogger<AuditLogArchiveService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var changeLog = scope.ServiceProvider.GetRequiredService<IChangeLogService>();
                var archived = await changeLog.ArchiveExpiredAsync(stoppingToken);
                var purged = await changeLog.PurgeArchivedAsync(stoppingToken);

                if (archived > 0 || purged > 0)
                {
                    _logger.LogInformation(
                        "Audit log maintenance: archived {Archived}, purged {Purged} records",
                        archived,
                        purged);
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Audit log archive job failed");
            }

            var intervalHours = 24;
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var settings = scope.ServiceProvider
                    .GetRequiredService<Microsoft.Extensions.Options.IOptions<HAPM.Application.Configuration.AuditSettings>>()
                    .Value;
                intervalHours = Math.Max(1, settings.ArchiveIntervalHours);
            }
            catch
            {
                // use default interval
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
