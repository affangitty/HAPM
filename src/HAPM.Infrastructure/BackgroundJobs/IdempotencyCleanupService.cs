using HAPM.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HAPM.Infrastructure.BackgroundJobs;

/// <summary>Deletes expired idempotency records once per hour.</summary>
public class IdempotencyCleanupService : BackgroundService
{
  private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

  private readonly IServiceScopeFactory _scopeFactory;
  private readonly ILogger<IdempotencyCleanupService> _logger;

  public IdempotencyCleanupService(IServiceScopeFactory scopeFactory, ILogger<IdempotencyCleanupService> logger)
  {
    _scopeFactory = scopeFactory;
    _logger = logger;
  }

  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    while (!stoppingToken.IsCancellationRequested)
    {
      try
      {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var idempotency = scope.ServiceProvider.GetRequiredService<IIdempotencyService>();
        var removed = await idempotency.PurgeExpiredAsync(stoppingToken);
        if (removed > 0)
          _logger.LogInformation("Purged {Count} expired idempotency records", removed);
      }
      catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
      {
        _logger.LogWarning(ex, "Idempotency cleanup failed");
      }

      try
      {
        await Task.Delay(Interval, stoppingToken);
      }
      catch (OperationCanceledException)
      {
        break;
      }
    }
  }
}
