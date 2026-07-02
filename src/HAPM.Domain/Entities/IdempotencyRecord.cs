using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

/// <summary>
/// Stores idempotent request state so retried writes can replay the original response.
/// </summary>
public class IdempotencyRecord
{
    public long Id { get; set; }
    public string IdempotencyKey { get; set; } = null!;
    /// <summary>Authenticated user id, or 0 for anonymous requests.</summary>
    public int UserScope { get; set; }
    public string HttpMethod { get; set; } = null!;
    public string RequestPath { get; set; } = null!;
    /// <summary>SHA-256 hex digest of the normalized request body.</summary>
    public string RequestBodyHash { get; set; } = null!;
    public IdempotencyStatus Status { get; set; }
    public int ResponseStatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public string? ResponseContentType { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
}
