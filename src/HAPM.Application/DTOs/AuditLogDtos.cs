using HAPM.Application.Common;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class AuditLogQueryParams : PaginationParams
{
    public string? EntityName { get; set; }
    public AuditAction? Action { get; set; }
    public int? UserId { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
}

public record AuditLogDto(
    int Id,
    int? UserId,
    string? UserEmail,
    string EntityName,
    string EntityId,
    AuditAction Action,
    string ChangesJson,
    DateTime TimestampUtc);
