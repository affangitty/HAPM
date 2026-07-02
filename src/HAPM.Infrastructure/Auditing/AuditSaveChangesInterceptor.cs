using System.Text.Json;
using HAPM.Application.ChangeLog;
using HAPM.Application.Interfaces;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace HAPM.Infrastructure.Auditing;

/// <summary>
/// Collects EF changes and persists them through <see cref="IChangeLogService"/>.
/// </summary>
public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private static readonly HashSet<Type> ExcludedTypes = new()
    {
        typeof(AuditLog), typeof(AuditLogArchive), typeof(Notification), typeof(RefreshToken),
        typeof(IdempotencyRecord), typeof(PasswordResetToken),
    };

    private static readonly HashSet<string> MaskedProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        nameof(User.PasswordHash),
        nameof(PasswordResetToken.Token),
    };

    private readonly ICurrentUserService _currentUser;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly List<ChangeLogEntry> _pending = new();

    public AuditSaveChangesInterceptor(ICurrentUserService currentUser, IServiceScopeFactory scopeFactory)
    {
        _currentUser = currentUser;
        _scopeFactory = scopeFactory;
    }

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
                    _pending.Add(BuildEntry(entry, AuditAction.Created, oldValues: null));
                    break;
                case EntityState.Modified:
                {
                    var oldValues = GetModifiedOriginalValues(entry);
                    if (oldValues.Count > 0)
                        _pending.Add(BuildEntry(entry, AuditAction.Updated, oldValues));
                    break;
                }
                case EntityState.Deleted:
                {
                    var oldValues = entry.Properties
                        .ToDictionary(p => p.Metadata.Name, p => Mask(p.Metadata.Name, p.OriginalValue));
                    _pending.Add(BuildEntry(entry, AuditAction.Deleted, oldValues));
                    break;
                }
            }
        }
    }

    private async Task WritePendingAsync(DbContext? context, CancellationToken ct)
    {
        if (context is null || _pending.Count == 0)
            return;

        var entries = _pending.ToList();
        _pending.Clear();

        await using var scope = _scopeFactory.CreateAsyncScope();
        var changeLog = scope.ServiceProvider.GetRequiredService<IChangeLogService>();
        await changeLog.WriteAsync(entries, ct);
    }

    private static ChangeLogEntry BuildEntry(EntityEntry entry, AuditAction action, Dictionary<string, object?>? oldValues)
    {
        var keyValue = entry.Properties
            .Where(p => p.Metadata.IsPrimaryKey())
            .Select(p => p.CurrentValue?.ToString() ?? p.OriginalValue?.ToString())
            .FirstOrDefault() ?? "?";

        return action switch
        {
            AuditAction.Created => new ChangeLogEntry(
                entry.Entity.GetType().Name,
                keyValue,
                action,
                new Dictionary<string, object?>(),
                entry.Properties.ToDictionary(p => p.Metadata.Name, p => Mask(p.Metadata.Name, p.CurrentValue))),
            AuditAction.Updated => new ChangeLogEntry(
                entry.Entity.GetType().Name,
                keyValue,
                action,
                oldValues ?? new Dictionary<string, object?>(),
                entry.Properties
                    .Where(p => p.IsModified)
                    .ToDictionary(p => p.Metadata.Name, p => Mask(p.Metadata.Name, p.CurrentValue))),
            AuditAction.Deleted => new ChangeLogEntry(
                entry.Entity.GetType().Name,
                keyValue,
                action,
                oldValues ?? new Dictionary<string, object?>(),
                new Dictionary<string, object?>()),
            _ => throw new InvalidOperationException($"Unsupported audit action {action}.")
        };
    }

    private static Dictionary<string, object?> GetModifiedOriginalValues(EntityEntry entry) =>
        entry.Properties
            .Where(p => p.IsModified && !Equals(p.OriginalValue, p.CurrentValue))
            .ToDictionary(p => p.Metadata.Name, p => Mask(p.Metadata.Name, p.OriginalValue));

    private static object? Mask(string propertyName, object? value) =>
        MaskedProperties.Contains(propertyName) ? "***" : value;
}
