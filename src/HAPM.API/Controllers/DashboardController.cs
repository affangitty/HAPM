using HAPM.API.Security;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = Roles.Admin)]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

    /// <summary>Hospital-wide KPIs: headcounts, appointment load, revenue and top specializations.</summary>
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats(CancellationToken ct) =>
        Ok(await _dashboardService.GetStatsAsync(ct));

    /// <summary>Appointment counts grouped by day-of-week × hour-of-day (heatmap data).</summary>
    [HttpGet("peak-hours")]
    public async Task<ActionResult<IReadOnlyList<PeakHourCellDto>>> GetPeakHours(
        [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        Ok(await _dashboardService.GetPeakHoursAsync(fromDate, toDate, ct));

    /// <summary>Received payments grouped by doctor specialization.</summary>
    [HttpGet("revenue-by-specialization")]
    public async Task<ActionResult<IReadOnlyList<SpecializationRevenueDto>>> GetRevenueBySpecialization(CancellationToken ct) =>
        Ok(await _dashboardService.GetRevenueBySpecializationAsync(ct));
}
