using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/prescriptions")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;

    public PrescriptionsController(IPrescriptionService prescriptionService) => _prescriptionService = prescriptionService;

    /// <summary>Lists prescriptions (scoped: patients see their own, doctors theirs, staff all).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<PrescriptionDto>>> GetAll([FromQuery] PrescriptionQueryParams query, CancellationToken ct) =>
        Ok(await _prescriptionService.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PrescriptionDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _prescriptionService.GetByIdAsync(id, ct));

    [HttpGet("by-appointment/{appointmentId:int}")]
    public async Task<ActionResult<PrescriptionDto>> GetByAppointment(int appointmentId, CancellationToken ct) =>
        Ok(await _prescriptionService.GetByAppointmentAsync(appointmentId, ct));

    /// <summary>Issues a prescription for a checked-in/completed appointment (one per appointment).</summary>
    [HttpPost]
    [Authorize(Roles = Roles.Doctor)]
    public async Task<ActionResult<PrescriptionDto>> Create(CreatePrescriptionRequest request, CancellationToken ct)
    {
        var prescription = await _prescriptionService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = prescription.Id }, prescription);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Doctor)]
    public async Task<ActionResult<PrescriptionDto>> Update(int id, UpdatePrescriptionRequest request, CancellationToken ct) =>
        Ok(await _prescriptionService.UpdateAsync(id, request, ct));
}
