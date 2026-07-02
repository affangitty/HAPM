using HAPM.Application.ChangeLog;
using HAPM.Application.Common;
using HAPM.Application.Configuration;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HAPM.Infrastructure.ChangeLog;

public class ChangeLogService : IChangeLogService, IAuditLogService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly AuditSettings _settings;

    public ChangeLogService(AppDbContext db, ICurrentUserService currentUser, IOptions<AuditSettings> settings)
    {
        _db = db;
        _currentUser = currentUser;
        _settings = settings.Value;
    }

    public async Task WriteAsync(IReadOnlyList<ChangeLogEntry> entries, CancellationToken ct = default)
    {
        if (entries.Count == 0)
            return;

        var logs = entries.Select(e => new AuditLog
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email,
            EntityName = e.EntityName,
            EntityId = e.EntityId,
            Action = e.Action,
            ChangesJson = ChangeLogJson.Serialize(e.Action, e.OldValues, e.NewValues),
        }).ToList();

        _db.AuditLogs.AddRange(logs);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryParams query, CancellationToken ct = default)
    {
        var logs = _db.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.EntityName))
            logs = logs.Where(l => l.EntityName == query.EntityName);

        if (query.Action.HasValue)
            logs = logs.Where(l => l.Action == query.Action.Value);

        if (query.UserId.HasValue)
            logs = logs.Where(l => l.UserId == query.UserId.Value);

        if (query.FromDate.HasValue)
        {
            var from = query.FromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            logs = logs.Where(l => l.CreatedAtUtc >= from);
        }

        if (query.ToDate.HasValue)
        {
            var to = query.ToDate.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            logs = logs.Where(l => l.CreatedAtUtc < to);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            logs = logs.Where(l =>
                l.EntityName.ToLower().Contains(term) ||
                l.EntityId.Contains(term) ||
                (l.UserEmail != null && l.UserEmail.ToLower().Contains(term)));
        }

        return await logs
            .OrderByDescending(l => l.Id)
            .Select(Projections.AuditLog)
            .ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<AuditLogDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var active = await _db.AuditLogs.AsNoTracking()
            .Where(l => l.Id == id)
            .Select(Projections.AuditLog)
            .FirstOrDefaultAsync(ct);

        if (active is not null)
            return active;

        var archived = await _db.AuditLogArchives.AsNoTracking()
            .Where(l => l.SourceAuditLogId == id)
            .Select(a => new AuditLogDto(
                a.SourceAuditLogId,
                a.UserId,
                a.UserEmail,
                a.EntityName,
                a.EntityId,
                a.Action,
                a.ChangesJson,
                a.CreatedAtUtc))
            .FirstOrDefaultAsync(ct);

        return archived ?? throw new NotFoundException("Audit log", id);
    }

    public async Task<int> ArchiveExpiredAsync(CancellationToken ct = default)
    {
        if (_settings.ArchiveAfterDays <= 0)
            return 0;

        var cutoff = DateTime.UtcNow.AddDays(-_settings.ArchiveAfterDays);
        var total = 0;

        while (true)
        {
            var batch = await _db.AuditLogs
                .Where(l => l.CreatedAtUtc < cutoff)
                .OrderBy(l => l.Id)
                .Take(500)
                .ToListAsync(ct);

            if (batch.Count == 0)
                break;

            var archivedAt = DateTime.UtcNow;
            _db.AuditLogArchives.AddRange(batch.Select(l => new AuditLogArchive
            {
                SourceAuditLogId = l.Id,
                UserId = l.UserId,
                UserEmail = l.UserEmail,
                EntityName = l.EntityName,
                EntityId = l.EntityId,
                Action = l.Action,
                ChangesJson = l.ChangesJson,
                CreatedAtUtc = l.CreatedAtUtc,
                ArchivedAtUtc = archivedAt,
            }));

            _db.AuditLogs.RemoveRange(batch);
            await _db.SaveChangesAsync(ct);
            total += batch.Count;
        }

        return total;
    }

    public async Task<int> PurgeArchivedAsync(CancellationToken ct = default)
    {
        if (_settings.PurgeArchiveAfterDays <= 0)
            return 0;

        var cutoff = DateTime.UtcNow.AddDays(-_settings.PurgeArchiveAfterDays);
        return await _db.AuditLogArchives
            .Where(l => l.ArchivedAtUtc < cutoff)
            .ExecuteDeleteAsync(ct);
    }
}
