using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/waitlist")]
[Authorize]
public class WaitlistController : ControllerBase
{
    private readonly IWaitlistService _waitlistService;

    public WaitlistController(IWaitlistService waitlistService) => _waitlistService = waitlistService;

    /// <summary>Waitlist entries (patients see their own, doctors theirs, staff all).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<WaitlistEntryDto>>> GetAll([FromQuery] WaitlistQueryParams query, CancellationToken ct) =>
        Ok(await _waitlistService.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<WaitlistEntryDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _waitlistService.GetByIdAsync(id, ct));

    /// <summary>
    /// Joins the waitlist for a doctor and date. When an appointment for that doctor/date is
    /// cancelled, all active waitlisted patients are notified automatically.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Patient + "," + Roles.Staff)]
    public async Task<ActionResult<WaitlistEntryDto>> Join(JoinWaitlistRequest request, CancellationToken ct) =>
        Ok(await _waitlistService.JoinAsync(request, ct));

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        await _waitlistService.CancelAsync(id, ct);
        return NoContent();
    }
}
