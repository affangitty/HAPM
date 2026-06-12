using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/vitals")]
[Authorize]
public class VitalsController : ControllerBase
{
    private readonly IVitalSignService _vitalSignService;

    public VitalsController(IVitalSignService vitalSignService) => _vitalSignService = vitalSignService;

    /// <summary>Vital sign history (patients see only their own). Filter by patientId or appointmentId.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<VitalSignDto>>> GetAll([FromQuery] VitalSignQueryParams query, CancellationToken ct) =>
        Ok(await _vitalSignService.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<VitalSignDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _vitalSignService.GetByIdAsync(id, ct));

    /// <summary>Records a set of vital sign readings for an appointment. BMI is computed automatically.</summary>
    [HttpPost]
    [Authorize(Roles = Roles.Clinical)]
    public async Task<ActionResult<VitalSignDto>> Record(RecordVitalSignRequest request, CancellationToken ct)
    {
        var vitals = await _vitalSignService.RecordAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = vitals.Id }, vitals);
    }
}
