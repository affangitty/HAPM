using HAPM.API.Security;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/exports")]
[Authorize(Roles = Roles.Staff)]
public class ExportsController : ControllerBase
{
    private const string CsvContentType = "text/csv";

    private readonly IExportService _exportService;

    public ExportsController(IExportService exportService) => _exportService = exportService;

    /// <summary>Downloads all appointments (optionally date-filtered) as CSV.</summary>
    [HttpGet("appointments")]
    public async Task<IActionResult> ExportAppointments([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct)
    {
        var export = await _exportService.ExportAppointmentsAsync(fromDate, toDate, ct);
        return File(export.Content, CsvContentType, export.FileName);
    }

    /// <summary>Downloads the patient register as CSV.</summary>
    [HttpGet("patients")]
    public async Task<IActionResult> ExportPatients(CancellationToken ct)
    {
        var export = await _exportService.ExportPatientsAsync(ct);
        return File(export.Content, CsvContentType, export.FileName);
    }

    /// <summary>Downloads invoices (optionally date-filtered) as CSV.</summary>
    [HttpGet("invoices")]
    public async Task<IActionResult> ExportInvoices([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct)
    {
        var export = await _exportService.ExportInvoicesAsync(fromDate, toDate, ct);
        return File(export.Content, CsvContentType, export.FileName);
    }
}
