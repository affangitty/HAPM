namespace HAPM.Application.Idempotency;

public enum IdempotencyBeginKind
{
  Proceed,
  Replay,
  InProgress,
  PayloadMismatch
}

public sealed record IdempotencyBeginResult(
  IdempotencyBeginKind Kind,
  long? RecordId = null,
  int? ReplayStatusCode = null,
  string? ReplayBody = null,
  string? ReplayContentType = null);
