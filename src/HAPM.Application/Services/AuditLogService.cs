using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IUnitOfWork _uow;

    public AuditLogService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryParams query, CancellationToken ct = default)
    {
        var logs = _uow.AuditLogs.Query();

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

    public async Task<AuditLogDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        await _uow.AuditLogs.Query()
            .Where(l => l.Id == id)
            .Select(Projections.AuditLog)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Audit log", id);
}
