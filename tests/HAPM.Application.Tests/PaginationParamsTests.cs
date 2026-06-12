using HAPM.Application.Common;

namespace HAPM.Application.Tests;

public class PaginationParamsTests
{
    [Theory]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    public void Page_clamps_to_minimum_one(int input, int expected)
    {
        var p = new PaginationParams { Page = input };
        Assert.Equal(expected, p.Page);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 1)]
    [InlineData(100, 100)]
    [InlineData(500, 100)]
    public void PageSize_clamps_between_one_and_one_hundred(int input, int expected)
    {
        var p = new PaginationParams { PageSize = input };
        Assert.Equal(expected, p.PageSize);
    }
}
