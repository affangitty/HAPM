using HAPM.Application.Idempotency;
using HAPM.Application.Interfaces;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using HAPM.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HAPM.Infrastructure.Idempotency;

public class IdempotencyService : IIdempotencyService
{
  private readonly AppDbContext _db;
  private readonly ILogger<IdempotencyService> _logger;

  public IdempotencyService(AppDbContext db, ILogger<IdempotencyService> logger)
  {
    _db = db;
    _logger = logger;
  }

  public async Task<IdempotencyBeginResult> BeginAsync(
    string idempotencyKey,
    int userScope,
    string httpMethod,
    string requestPath,
    string requestBodyHash,
    CancellationToken ct = default)
  {
    var normalizedPath = IdempotencyPolicy.NormalizePath(requestPath);
    var existing = await _db.IdempotencyRecords
      .AsNoTracking()
      .FirstOrDefaultAsync(r => r.UserScope == userScope && r.IdempotencyKey == idempotencyKey, ct);

    if (existing is not null)
    {
      if (!string.Equals(existing.RequestBodyHash, requestBodyHash, StringComparison.Ordinal) ||
          !string.Equals(existing.HttpMethod, httpMethod, StringComparison.OrdinalIgnoreCase) ||
          !string.Equals(existing.RequestPath, normalizedPath, StringComparison.OrdinalIgnoreCase))
      {
        return new IdempotencyBeginResult(IdempotencyBeginKind.PayloadMismatch);
      }

      return existing.Status switch
      {
        IdempotencyStatus.Completed => new IdempotencyBeginResult(
          IdempotencyBeginKind.Replay,
          existing.Id,
          existing.ResponseStatusCode,
          existing.ResponseBody,
          existing.ResponseContentType),
        IdempotencyStatus.InProgress => new IdempotencyBeginResult(IdempotencyBeginKind.InProgress, existing.Id),
        IdempotencyStatus.Failed => await RestartFailedAsync(existing, userScope, idempotencyKey, httpMethod, normalizedPath, requestBodyHash, ct),
        _ => new IdempotencyBeginResult(IdempotencyBeginKind.InProgress, existing.Id),
      };
    }

    var record = new IdempotencyRecord
    {
      IdempotencyKey = idempotencyKey,
      UserScope = userScope,
      HttpMethod = httpMethod.ToUpperInvariant(),
      RequestPath = normalizedPath,
      RequestBodyHash = requestBodyHash,
      Status = IdempotencyStatus.InProgress,
      ExpiresAtUtc = DateTime.UtcNow.Add(IdempotencyPolicy.Retention),
    };

    _db.IdempotencyRecords.Add(record);

    try
    {
      await _db.SaveChangesAsync(ct);
      return new IdempotencyBeginResult(IdempotencyBeginKind.Proceed, record.Id);
    }
    catch (DbUpdateException ex)
    {
      _logger.LogDebug(ex, "Idempotency insert race for key {Key}", idempotencyKey);
      return await BeginAsync(idempotencyKey, userScope, httpMethod, normalizedPath, requestBodyHash, ct);
    }
  }

  public async Task CompleteAsync(
    long recordId,
    int statusCode,
    string? responseBody,
    string? responseContentType,
    CancellationToken ct = default)
  {
    var record = await _db.IdempotencyRecords.FirstOrDefaultAsync(r => r.Id == recordId, ct);
    if (record is null)
      return;

    if (statusCode >= 500)
    {
      record.Status = IdempotencyStatus.Failed;
      record.CompletedAtUtc = DateTime.UtcNow;
      await _db.SaveChangesAsync(ct);
      return;
    }

    record.Status = IdempotencyStatus.Completed;
    record.ResponseStatusCode = statusCode;
    record.ResponseBody = responseBody;
    record.ResponseContentType = responseContentType;
    record.CompletedAtUtc = DateTime.UtcNow;
    await _db.SaveChangesAsync(ct);
  }

  public async Task FailAsync(long recordId, CancellationToken ct = default)
  {
    var record = await _db.IdempotencyRecords.FirstOrDefaultAsync(r => r.Id == recordId, ct);
    if (record is null)
      return;

    record.Status = IdempotencyStatus.Failed;
    record.CompletedAtUtc = DateTime.UtcNow;
    await _db.SaveChangesAsync(ct);
  }

  public async Task<int> PurgeExpiredAsync(CancellationToken ct = default)
  {
    var now = DateTime.UtcNow;
    return await _db.IdempotencyRecords
      .Where(r => r.ExpiresAtUtc < now)
      .ExecuteDeleteAsync(ct);
  }

  private async Task<IdempotencyBeginResult> RestartFailedAsync(
    IdempotencyRecord existing,
    int userScope,
    string idempotencyKey,
    string httpMethod,
    string normalizedPath,
    string requestBodyHash,
    CancellationToken ct)
  {
    var tracked = await _db.IdempotencyRecords.FirstAsync(r => r.Id == existing.Id, ct);
    tracked.Status = IdempotencyStatus.InProgress;
    tracked.ResponseStatusCode = 0;
    tracked.ResponseBody = null;
    tracked.ResponseContentType = null;
    tracked.CompletedAtUtc = null;
    tracked.HttpMethod = httpMethod.ToUpperInvariant();
    tracked.RequestPath = normalizedPath;
    tracked.RequestBodyHash = requestBodyHash;
    tracked.UserScope = userScope;
    tracked.IdempotencyKey = idempotencyKey;
    tracked.ExpiresAtUtc = DateTime.UtcNow.Add(IdempotencyPolicy.Retention);
    await _db.SaveChangesAsync(ct);
    return new IdempotencyBeginResult(IdempotencyBeginKind.Proceed, tracked.Id);
  }
}
