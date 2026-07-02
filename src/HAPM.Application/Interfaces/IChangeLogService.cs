using HAPM.Application.ChangeLog;
using HAPM.Application.Common;
using HAPM.Application.DTOs;

namespace HAPM.Application.Interfaces;

/// <summary>Persists and queries entity change history (audit / changelog).</summary>
public interface IChangeLogService
{
    Task WriteAsync(IReadOnlyList<ChangeLogEntry> entries, CancellationToken ct = default);

    Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryParams query, CancellationToken ct = default);

    Task<AuditLogDto> GetByIdAsync(int id, CancellationToken ct = default);

    Task<int> ArchiveExpiredAsync(CancellationToken ct = default);

    Task<int> PurgeArchivedAsync(CancellationToken ct = default);
}
