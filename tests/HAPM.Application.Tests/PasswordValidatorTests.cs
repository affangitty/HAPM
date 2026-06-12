using HAPM.Application.Validation;

namespace HAPM.Application.Tests;

public class PasswordValidatorTests
{
    [Theory]
    [InlineData("Admin@12345")]
    [InlineData("Patient@12345")]
    [InlineData("Str0ng!Pass")]
    public void IsValid_accepts_strong_passwords(string password)
    {
        Assert.True(PasswordValidator.IsValid(password));
    }

    [Theory]
    [InlineData("")]
    [InlineData("short1!")]
    [InlineData("alllowercase1!")]
    [InlineData("ALLUPPERCASE1!")]
    [InlineData("NoDigits!!")]
    [InlineData("NoSpecial123")]
    public void IsValid_rejects_weak_passwords(string password)
    {
        Assert.False(PasswordValidator.IsValid(password));
    }
}
