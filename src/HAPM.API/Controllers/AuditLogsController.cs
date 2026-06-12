using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = Roles.Admin)]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService) => _auditLogService = auditLogService;

    /// <summary>Data-change audit trail. Filter by entityName, action, userId and date range.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> GetAll([FromQuery] AuditLogQueryParams query, CancellationToken ct) =>
        Ok(await _auditLogService.GetPagedAsync(query, ct));
}
