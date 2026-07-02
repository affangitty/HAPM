using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

/// <summary>Cold storage for audit logs moved out of the hot <see cref="AuditLog"/> table.</summary>
public class AuditLogArchive
{
    public long Id { get; set; }
    public int SourceAuditLogId { get; set; }
    public int? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string EntityName { get; set; } = null!;
    public string EntityId { get; set; } = null!;
    public AuditAction Action { get; set; }
    public string ChangesJson { get; set; } = null!;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ArchivedAtUtc { get; set; } = DateTime.UtcNow;
}
