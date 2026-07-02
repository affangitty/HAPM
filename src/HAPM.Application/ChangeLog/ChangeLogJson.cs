using System.Text.Json;
using HAPM.Domain.Enums;

namespace HAPM.Application.ChangeLog;

/// <summary>Serializes field-level old/new values for audit storage.</summary>
public static class ChangeLogJson
{
    public static string Serialize(AuditAction action, IReadOnlyDictionary<string, object?> oldValues, IReadOnlyDictionary<string, object?> newValues)
    {
        var fields = action switch
        {
            AuditAction.Created => newValues.Keys,
            AuditAction.Deleted => oldValues.Keys,
            _ => oldValues.Keys.Union(newValues.Keys).Distinct(StringComparer.Ordinal)
        };

        var changes = new Dictionary<string, object?>(StringComparer.Ordinal);
        foreach (var field in fields)
        {
            oldValues.TryGetValue(field, out var oldValue);
            newValues.TryGetValue(field, out var newValue);
            changes[field] = new { old = oldValue, @new = newValue };
        }

        return JsonSerializer.Serialize(changes);
    }
}
