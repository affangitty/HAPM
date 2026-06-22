using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/staff-messages")]
[Authorize(Roles = Roles.Clinical)]
public class StaffMessagesController : ControllerBase
{
    private readonly IStaffMessageService _messages;

    public StaffMessagesController(IStaffMessageService messages) => _messages = messages;

    /// <summary>Staff message history (doctor room or broadcast).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<StaffMessageDto>>> GetAll(
        [FromQuery] StaffMessageQueryParams query, CancellationToken ct) =>
        Ok(await _messages.GetPagedAsync(query, ct));

    /// <summary>Receptionist or admin sends an operational message to a doctor's room.</summary>
    [HttpPost("to-doctor")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<StaffMessageDto>> SendToDoctor(
        SendDoctorMessageRequest request, CancellationToken ct)
    {
        var message = await _messages.SendToDoctorAsync(request, ct);
        return CreatedAtAction(nameof(GetAll), new { id = message.Id }, message);
    }

    /// <summary>Admin broadcasts a message to all connected staff.</summary>
    [HttpPost("broadcast")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<StaffMessageDto>> Broadcast(
        BroadcastStaffMessageRequest request, CancellationToken ct)
    {
        var message = await _messages.BroadcastToStaffAsync(request, ct);
        return Ok(message);
    }
}
