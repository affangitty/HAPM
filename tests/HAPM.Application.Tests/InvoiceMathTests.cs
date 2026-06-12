using HAPM.Application.Common;

namespace HAPM.Application.Tests;

public class InvoiceMathTests
{
    [Fact]
    public void Calculate_applies_tax_and_discount()
    {
        var (subTotal, taxAmount, total) = InvoiceMath.Calculate(
            new[] { 100m, 50m },
            taxPercent: 10m,
            discountAmount: 5m);

        Assert.Equal(150m, subTotal);
        Assert.Equal(15m, taxAmount);
        Assert.Equal(160m, total);
    }

    [Fact]
    public void Calculate_rounds_tax_to_two_decimals()
    {
        var (_, taxAmount, total) = InvoiceMath.Calculate(
            new[] { 33.33m },
            taxPercent: 7.5m,
            discountAmount: 0m);

        Assert.Equal(2.50m, taxAmount);
        Assert.Equal(35.83m, total);
    }

    [Fact]
    public void Calculate_can_produce_negative_total_when_discount_exceeds_subtotal_plus_tax()
    {
        var (_, _, total) = InvoiceMath.Calculate(
            new[] { 10m },
            taxPercent: 0m,
            discountAmount: 50m);

        Assert.Equal(-40m, total);
    }
}
