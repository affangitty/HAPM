using HAPM.API.Security;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

    /// <summary>Hospital-wide KPIs: headcounts, appointment load, revenue and top specializations.</summary>
    [HttpGet("stats")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<DashboardStatsDto>> GetStats(CancellationToken ct) =>
        Ok(await _dashboardService.GetStatsAsync(ct));

    /// <summary>Appointment counts grouped by day-of-week × hour-of-day (heatmap data).</summary>
    [HttpGet("peak-hours")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<PeakHourCellDto>>> GetPeakHours(
        [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        Ok(await _dashboardService.GetPeakHoursAsync(fromDate, toDate, ct));

    /// <summary>Received payments grouped by doctor specialization.</summary>
    [HttpGet("revenue-by-specialization")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<SpecializationRevenueDto>>> GetRevenueBySpecialization(CancellationToken ct) =>
        Ok(await _dashboardService.GetRevenueBySpecializationAsync(ct));

    [HttpGet("doctor")]
    [Authorize(Roles = Roles.Doctor)]
    public async Task<ActionResult<DoctorRoleDashboardDto>> GetDoctorDashboard(CancellationToken ct) =>
        Ok(await _dashboardService.GetDoctorDashboardAsync(ct));

    [HttpGet("patient")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<ActionResult<PatientRoleDashboardDto>> GetPatientDashboard(CancellationToken ct) =>
        Ok(await _dashboardService.GetPatientDashboardAsync(ct));

    [HttpGet("receptionist")]
    [Authorize(Roles = Roles.Receptionist)]
    public async Task<ActionResult<ReceptionistRoleDashboardDto>> GetReceptionistDashboard(CancellationToken ct) =>
        Ok(await _dashboardService.GetReceptionistDashboardAsync(ct));
}
