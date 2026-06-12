using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/lab-reports")]
[Authorize]
public class LabReportsController : ControllerBase
{
    private readonly ILabReportService _labReportService;

    public LabReportsController(ILabReportService labReportService) => _labReportService = labReportService;

    /// <summary>Lists lab reports (patients see only their own).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<LabReportDto>>> GetAll([FromQuery] LabReportQueryParams query, CancellationToken ct) =>
        Ok(await _labReportService.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LabReportDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _labReportService.GetByIdAsync(id, ct));

    /// <summary>Streams the underlying report file.</summary>
    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download(int id, CancellationToken ct)
    {
        var file = await _labReportService.DownloadAsync(id, ct);
        return File(file.Content, file.ContentType, file.FileName);
    }

    /// <summary>Uploads a report file (multipart/form-data, max 10 MB; pdf/jpg/jpeg/png/dcm).</summary>
    [HttpPost]
    [Authorize(Roles = Roles.Clinical)]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<ActionResult<LabReportDto>> Upload([FromForm] UploadLabReportRequest request, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "A non-empty file is required." });

        await using var stream = file.OpenReadStream();
        var report = await _labReportService.UploadAsync(request, stream, file.FileName, file.ContentType, file.Length, ct);
        return CreatedAtAction(nameof(GetById), new { id = report.Id }, report);
    }

    /// <summary>Updates report metadata and optionally replaces the file (resets review status when file changes).</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Clinical)]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<ActionResult<LabReportDto>> Update(int id, [FromForm] UpdateLabReportRequest request, IFormFile? file, CancellationToken ct)
    {
        Stream? stream = null;
        if (file is { Length: > 0 })
            stream = file.OpenReadStream();

        try
        {
            var report = await _labReportService.UpdateAsync(
                id, request, stream, file?.FileName, file?.ContentType, file?.Length, ct);
            return Ok(report);
        }
        finally
        {
            stream?.Dispose();
        }
    }

    /// <summary>Marks the report as reviewed with the doctor's remarks.</summary>
    [HttpPost("{id:int}/review")]
    [Authorize(Roles = Roles.Doctor)]
    public async Task<ActionResult<LabReportDto>> Review(int id, ReviewLabReportRequest request, CancellationToken ct) =>
        Ok(await _labReportService.ReviewAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _labReportService.DeleteAsync(id, ct);
        return NoContent();
    }
}
