using HAPM.Domain.Common;
using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

/// <summary>Immutable record of a data change, written automatically by an EF interceptor.</summary>
public class AuditLog : BaseEntity
{
    public int? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string EntityName { get; set; } = null!;
    public string EntityId { get; set; } = null!;
    public AuditAction Action { get; set; }
    /// <summary>JSON document with old/new values of the changed properties.</summary>
    public string ChangesJson { get; set; } = null!;
}
