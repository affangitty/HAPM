namespace HAPM.Application.Common;

public static class InvoiceMath
{
    public static (decimal SubTotal, decimal TaxAmount, decimal Total) Calculate(
        IEnumerable<decimal> lineAmounts,
        decimal taxPercent,
        decimal discountAmount)
    {
        var subTotal = lineAmounts.Sum();
        var taxAmount = Math.Round(subTotal * taxPercent / 100m, 2);
        var total = subTotal + taxAmount - discountAmount;
        return (subTotal, taxAmount, total);
    }
}
