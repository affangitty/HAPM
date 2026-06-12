using HAPM.Domain.Common;

namespace HAPM.Domain.Entities;

public class InvoiceItem : BaseEntity
{
    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;

    public string Description { get; set; } = null!;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}
