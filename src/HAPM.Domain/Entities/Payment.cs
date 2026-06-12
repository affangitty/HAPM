using HAPM.Domain.Common;
using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

/// <summary>A (possibly partial) payment against an invoice, with its own receipt number.</summary>
public class Payment : BaseEntity
{
    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;

    /// <summary>Auto-generated, e.g. RCP-2026-000012.</summary>
    public string ReceiptNumber { get; set; } = null!;
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Notes { get; set; }
    public int ReceivedByUserId { get; set; }
}
