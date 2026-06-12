using HAPM.API.Security;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/prescription-templates")]
[Authorize(Roles = Roles.Doctor)]
public class PrescriptionTemplatesController : ControllerBase
{
    private readonly IPrescriptionTemplateService _templates;

    public PrescriptionTemplatesController(IPrescriptionTemplateService templates) => _templates = templates;

    /// <summary>Lists the current doctor's saved templates.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PrescriptionTemplateDto>>> GetMine(CancellationToken ct) =>
        Ok(await _templates.GetMineAsync(ct));

    /// <summary>Fetches one template, e.g. to prefill a new prescription.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PrescriptionTemplateDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _templates.GetByIdAsync(id, ct));

    /// <summary>Saves a new named template (diagnosis + medicines).</summary>
    [HttpPost]
    public async Task<ActionResult<PrescriptionTemplateDto>> Create(SavePrescriptionTemplateRequest request, CancellationToken ct)
    {
        var template = await _templates.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = template.Id }, template);
    }

    /// <summary>Updates an existing template.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<PrescriptionTemplateDto>> Update(int id, SavePrescriptionTemplateRequest request, CancellationToken ct) =>
        Ok(await _templates.UpdateAsync(id, request, ct));

    /// <summary>Deletes a template.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _templates.DeleteAsync(id, ct);
        return NoContent();
    }
}
