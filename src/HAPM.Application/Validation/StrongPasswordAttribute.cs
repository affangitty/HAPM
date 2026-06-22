using System.ComponentModel.DataAnnotations;

namespace HAPM.Application.Validation;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class StrongPasswordAttribute : ValidationAttribute
{
    public StrongPasswordAttribute() : base(PasswordValidator.ErrorMessage) { }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is not string password)
            return ValidationResult.Success;

        return PasswordValidator.IsValid(password)
            ? ValidationResult.Success
            : new ValidationResult(ErrorMessage ?? PasswordValidator.ErrorMessage, new[] { validationContext.MemberName! });
    }
}
