using HAPM.Domain.Common;
using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

public class Invoice : BaseEntity
{
    /// <summary>Auto-generated, e.g. INV-2026-000045.</summary>
    public string InvoiceNumber { get; set; } = null!;

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public decimal SubTotal { get; set; }
    public decimal TaxPercent { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;
    /// <summary>Set when the invoice becomes fully paid.</summary>
    public DateTime? PaidAtUtc { get; set; }
    public string? Notes { get; set; }

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
