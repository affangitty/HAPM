using HAPM.Application.Idempotency;

namespace HAPM.Application.Interfaces;

public interface IIdempotencyService
{
  Task<IdempotencyBeginResult> BeginAsync(
    string idempotencyKey,
    int userScope,
    string httpMethod,
    string requestPath,
    string requestBodyHash,
    CancellationToken ct = default);

  Task CompleteAsync(
    long recordId,
    int statusCode,
    string? responseBody,
    string? responseContentType,
    CancellationToken ct = default);

  Task FailAsync(long recordId, CancellationToken ct = default);

  Task<int> PurgeExpiredAsync(CancellationToken ct = default);
}
