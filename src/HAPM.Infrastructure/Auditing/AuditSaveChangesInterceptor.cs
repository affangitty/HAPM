using System.Text.Json;
using HAPM.Application.Interfaces;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace HAPM.Infrastructure.Auditing;

/// <summary>
/// Writes an <see cref="AuditLog"/> row for every create/update/delete on domain entities.
/// High-churn technical tables (audit logs themselves, notifications, refresh tokens) are excluded.
/// </summary>
public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private static readonly HashSet<Type> ExcludedTypes = new()
    {
        typeof(AuditLog), typeof(Notification), typeof(RefreshToken)
    };

    private static readonly HashSet<string> MaskedProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        nameof(User.PasswordHash)
    };

    private readonly ICurrentUserService _currentUser;
    private readonly List<PendingAudit> _pending = new();

    public AuditSaveChangesInterceptor(ICurrentUserService currentUser) => _currentUser = currentUser;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
            CollectPending(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
            CollectPending(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
    {
        await WritePendingAsync(eventData.Context, cancellationToken);
        return await base.SavedChangesAsync(eventData, result, cancellationToken);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        WritePendingAsync(eventData.Context, CancellationToken.None).GetAwaiter().GetResult();
        return base.SavedChanges(eventData, result);
    }

    private void CollectPending(DbContext context)
    {
        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (ExcludedTypes.Contains(entry.Entity.GetType()))
                continue;

            switch (entry.State)
            {
                case EntityState.Added:
                    _pending.Add(new PendingAudit(entry, AuditAction.Created, OldValues: null));
                    break;
                case EntityState.Modified:
                {
                    var oldValues = entry.Properties
                        .Where(p => p.IsModified && !Equals(p.OriginalValue, p.CurrentValue))
                        .ToDictionary(p => p.Metadata.Name, p => Mask(p.Metadata.Name, p.OriginalValue));
                    if (oldValues.Count > 0)
                        _pending.Add(new PendingAudit(entry, AuditAction.Updated, oldValues));
                    break;
                }
                case EntityState.Deleted:
                {
                    var oldValues = entry.Properties
                        .ToDictionary(p => p.Metadata.Name, p => Mask(p.Metadata.Name, p.OriginalValue));
                    _pending.Add(new PendingAudit(entry, AuditAction.Deleted, oldValues));
                    break;
                }
            }
        }
    }

    private async Task WritePendingAsync(DbContext? context, CancellationToken ct)
    {
        if (context is null || _pending.Count == 0)
            return;

        var logs = _pending.Select(p => p.ToAuditLog(_currentUser)).ToList();
        _pending.Clear(); // cleared before re-entrant SaveChanges below

        context.Set<AuditLog>().AddRange(logs);
        await context.SaveChangesAsync(ct);
    }

    private static object? Mask(string propertyName, object? value) =>
        MaskedProperties.Contains(propertyName) ? "***" : value;

    private sealed record PendingAudit(EntityEntry Entry, AuditAction Action, Dictionary<string, object?>? OldValues)
    {
        public AuditLog ToAuditLog(ICurrentUserService currentUser)
        {
            // For Added entities the database-generated key is available only after save.
            var keyValue = Entry.Properties
                .Where(p => p.Metadata.IsPrimaryKey())
                .Select(p => p.CurrentValue?.ToString())
                .FirstOrDefault() ?? "?";

            var changes = new Dictionary<string, object?>();
            if (OldValues is not null)
                changes["old"] = OldValues;
            if (Action is AuditAction.Created or AuditAction.Updated)
            {
                changes["new"] = Entry.Properties
                    .Where(p => Action == AuditAction.Created || p.IsModified)
                    .ToDictionary(p => p.Metadata.Name, p => Mask(p.Metadata.Name, p.CurrentValue));
            }

            return new AuditLog
            {
                UserId = currentUser.UserId,
                UserEmail = currentUser.Email,
                EntityName = Entry.Entity.GetType().Name,
                EntityId = keyValue,
                Action = Action,
                ChangesJson = JsonSerializer.Serialize(changes)
            };
        }
    }
}
