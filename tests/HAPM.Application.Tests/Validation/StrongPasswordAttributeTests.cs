using System.ComponentModel.DataAnnotations;
using HAPM.Application.DTOs;
using HAPM.Application.Validation;

namespace HAPM.Application.Tests.Validation;

public class StrongPasswordAttributeTests
{
    [Theory]
    [InlineData("Valid@123")]
    [InlineData("Admin@12345")]
    public void Valid_passwords_pass_validation(string password)
    {
        var request = new RegisterPatientRequest
        {
            Email = "test@test.local",
            Password = password,
            FullName = "Test User",
            PhoneNumber = "+1234567890",
            DateOfBirth = new DateOnly(1990, 1, 1),
            Gender = Domain.Enums.Gender.Male
        };

        var results = Validate(request);
        Assert.DoesNotContain(results, r => r.MemberNames.Contains(nameof(RegisterPatientRequest.Password)));
    }

    [Theory]
    [InlineData("short1!")]
    [InlineData("alllowercase1!")]
    public void Weak_passwords_fail_validation(string password)
    {
        var request = new RegisterPatientRequest
        {
            Email = "test@test.local",
            Password = password,
            FullName = "Test User",
            PhoneNumber = "+1234567890",
            DateOfBirth = new DateOnly(1990, 1, 1),
            Gender = Domain.Enums.Gender.Male
        };

        var results = Validate(request);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RegisterPatientRequest.Password)));
    }

    private static List<ValidationResult> Validate(object model)
    {
        var context = new ValidationContext(model);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, context, results, validateAllProperties: true);
        return results;
    }
}
