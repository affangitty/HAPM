using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService) => _appointmentService = appointmentService;

    /// <summary>
    /// Lists appointments with filters and pagination.
    /// Patients see only their own; doctors see only theirs; staff see all.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<AppointmentDto>>> GetAll([FromQuery] AppointmentQueryParams query, CancellationToken ct) =>
        Ok(await _appointmentService.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AppointmentDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _appointmentService.GetByIdAsync(id, ct));

    /// <summary>
    /// Books an appointment. Slot must fall inside the doctor's schedule, align to the slot
    /// grid and be conflict-free for both doctor and patient.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Patient + "," + Roles.Staff)]
    public async Task<ActionResult<AppointmentDto>> Book(BookAppointmentRequest request, CancellationToken ct)
    {
        var appointment = await _appointmentService.BookAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, appointment);
    }

    [HttpPost("{id:int}/confirm")]
    [Authorize(Roles = Roles.Clinical)]
    public async Task<ActionResult<AppointmentDto>> Confirm(int id, CancellationToken ct) =>
        Ok(await _appointmentService.ConfirmAsync(id, ct));

    [HttpPost("{id:int}/check-in")]
    [Authorize(Roles = Roles.Clinical)]
    public async Task<ActionResult<AppointmentDto>> CheckIn(int id, CancellationToken ct) =>
        Ok(await _appointmentService.CheckInAsync(id, ct));

    [HttpPost("{id:int}/complete")]
    [Authorize(Roles = Roles.Clinical)]
    public async Task<ActionResult<AppointmentDto>> Complete(int id, CompleteAppointmentRequest request, CancellationToken ct) =>
        Ok(await _appointmentService.CompleteAsync(id, request, ct));

    /// <summary>Patients may cancel their own appointment; doctors theirs; staff any.</summary>
    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<AppointmentDto>> Cancel(int id, CancelAppointmentRequest request, CancellationToken ct) =>
        Ok(await _appointmentService.CancelAsync(id, request, ct));

    [HttpPost("{id:int}/no-show")]
    [Authorize(Roles = Roles.Clinical)]
    public async Task<ActionResult<AppointmentDto>> MarkNoShow(int id, CancellationToken ct) =>
        Ok(await _appointmentService.MarkNoShowAsync(id, ct));

    [HttpPatch("{id:int}/reschedule")]
    public async Task<ActionResult<AppointmentDto>> Reschedule(int id, RescheduleAppointmentRequest request, CancellationToken ct) =>
        Ok(await _appointmentService.RescheduleAsync(id, request, ct));
}
