using HAPM.Application.Common;
using HAPM.Application.Validation;

namespace HAPM.Application.Tests;

public class VitalSignRulesTests
{
    [Fact]
    public void ValidateBloodPressure_allows_valid_pair()
    {
        var ex = Record.Exception(() => VitalSignRules.ValidateBloodPressure(120, 80));
        Assert.Null(ex);
    }

    [Fact]
    public void ValidateBloodPressure_allows_partial_readings()
    {
        var ex = Record.Exception(() => VitalSignRules.ValidateBloodPressure(120, null));
        Assert.Null(ex);
    }

    [Fact]
    public void ValidateBloodPressure_rejects_systolic_not_greater_than_diastolic()
    {
        var ex = Assert.Throws<BadRequestException>(() => VitalSignRules.ValidateBloodPressure(80, 120));
        Assert.Contains("Systolic", ex.Message);
    }
}
