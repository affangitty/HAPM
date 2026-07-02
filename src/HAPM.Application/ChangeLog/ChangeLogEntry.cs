using HAPM.Domain.Enums;

namespace HAPM.Application.ChangeLog;

public sealed record ChangeLogEntry(
    string EntityName,
    string EntityId,
    AuditAction Action,
    IReadOnlyDictionary<string, object?> OldValues,
    IReadOnlyDictionary<string, object?> NewValues);
