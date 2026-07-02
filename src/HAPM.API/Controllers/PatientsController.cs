using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientsController(IPatientService patientService) => _patientService = patientService;

    /// <summary>Search patients. Receptionists/admins: all patients. Doctors: only patients they have treated.</summary>
    [HttpGet]
    [Authorize(Roles = Roles.Clinical)]
    public async Task<ActionResult<PagedResult<PatientDto>>> GetAll([FromQuery] PatientQueryParams query, CancellationToken ct) =>
        Ok(await _patientService.GetPagedAsync(query, ct));

    /// <summary>The signed-in patient's own profile.</summary>
    [HttpGet("me")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<ActionResult<PatientDto>> GetMyProfile(CancellationToken ct) =>
        Ok(await _patientService.GetMyProfileAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PatientDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _patientService.GetByIdAsync(id, ct));

    /// <summary>Full medical history: appointments, prescriptions and lab reports.</summary>
    [HttpGet("{id:int}/medical-history")]
    public async Task<ActionResult<PatientMedicalHistoryDto>> GetMedicalHistory(int id, CancellationToken ct) =>
        Ok(await _patientService.GetMedicalHistoryAsync(id, ct));

    /// <summary>Front-desk registration of a walk-in patient.</summary>
    [HttpPost]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<PatientDto>> Create(CreatePatientRequest request, CancellationToken ct)
    {
        var patient = await _patientService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, patient);
    }

    /// <summary>Patients may update their own record; receptionists and admins may update any; doctors may update their patients.</summary>
    [HttpPatch("{id:int}")]
    public async Task<ActionResult<PatientDto>> Patch(int id, PatchPatientRequest request, CancellationToken ct) =>
        Ok(await _patientService.PatchAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Deactivate(int id, CancellationToken ct)
    {
        await _patientService.DeactivateAsync(id, ct);
        return NoContent();
    }
}
