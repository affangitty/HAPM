using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IBillingService _billingService;

    public InvoicesController(IBillingService billingService) => _billingService = billingService;

    /// <summary>Lists invoices (patients see only their own).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<InvoiceDto>>> GetAll([FromQuery] InvoiceQueryParams query, CancellationToken ct) =>
        Ok(await _billingService.GetPagedAsync(query, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InvoiceDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _billingService.GetByIdAsync(id, ct));

    /// <summary>
    /// Creates an invoice. When an appointmentId is supplied the doctor's consultation fee
    /// is added automatically as the first line item.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<InvoiceDto>> Create(CreateInvoiceRequest request, CancellationToken ct)
    {
        var invoice = await _billingService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
    }

    /// <summary>Updates a pending invoice (line items, tax, discount, notes).</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<InvoiceDto>> Update(int id, UpdateInvoiceRequest request, CancellationToken ct) =>
        Ok(await _billingService.UpdateAsync(id, request, ct));

    /// <summary>
    /// Records a (possibly partial) payment. Each payment gets a receipt number; the invoice
    /// moves to PartiallyPaid and finally Paid when the balance reaches zero.
    /// </summary>
    [HttpPost("{id:int}/payments")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<InvoiceDto>> AddPayment(int id, AddPaymentRequest request, CancellationToken ct) =>
        Ok(await _billingService.AddPaymentAsync(id, request, ct));

    /// <summary>Payment receipts for an invoice.</summary>
    [HttpGet("{id:int}/payments")]
    public async Task<ActionResult<IReadOnlyList<PaymentDto>>> GetPayments(int id, CancellationToken ct) =>
        Ok(await _billingService.GetPaymentsAsync(id, ct));

    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<InvoiceDto>> Cancel(int id, CancellationToken ct) =>
        Ok(await _billingService.CancelAsync(id, ct));
}
