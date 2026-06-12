using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class InvoiceItemRequest
{
    [Required, MaxLength(300)]
    public string Description { get; set; } = null!;

    [Range(1, 1000)]
    public int Quantity { get; set; } = 1;

    [Range(0.01, 10_000_000)]
    public decimal UnitPrice { get; set; }
}

public class UpdateInvoiceRequest
{
    [Range(0, 100)]
    public decimal TaxPercent { get; set; }

    [Range(0, 10_000_000)]
    public decimal DiscountAmount { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [Required, MinLength(1)]
    public List<InvoiceItemRequest> Items { get; set; } = new();
}

public class CreateInvoiceRequest
{
    [Required]
    public int PatientId { get; set; }

    /// <summary>Optional. When set, the doctor's consultation fee is added automatically as a line item.</summary>
    public int? AppointmentId { get; set; }

    [Range(0, 100)]
    public decimal TaxPercent { get; set; }

    [Range(0, 10_000_000)]
    public decimal DiscountAmount { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public List<InvoiceItemRequest> Items { get; set; } = new();
}

public class AddPaymentRequest
{
    [Range(0.01, 10_000_000)]
    public decimal Amount { get; set; }

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class InvoiceQueryParams : PaginationParams
{
    public int? PatientId { get; set; }
    public InvoiceStatus? Status { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
}

public record InvoiceItemDto(int Id, string Description, int Quantity, decimal UnitPrice, decimal Amount);

public record PaymentDto(
    int Id,
    string ReceiptNumber,
    decimal Amount,
    PaymentMethod Method,
    string? Notes,
    DateTime PaidAtUtc);

public record InvoiceDto(
    int Id,
    string InvoiceNumber,
    int PatientId,
    string PatientName,
    string MedicalRecordNumber,
    int? AppointmentId,
    decimal SubTotal,
    decimal TaxPercent,
    decimal TaxAmount,
    decimal DiscountAmount,
    decimal TotalAmount,
    decimal AmountPaid,
    decimal BalanceDue,
    InvoiceStatus Status,
    DateTime? PaidAtUtc,
    string? Notes,
    DateTime CreatedAtUtc,
    IReadOnlyList<InvoiceItemDto> Items,
    IReadOnlyList<PaymentDto> Payments);
