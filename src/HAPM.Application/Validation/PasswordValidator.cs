using System.Text.RegularExpressions;

namespace HAPM.Application.Validation;

public static partial class PasswordValidator
{
    public const string ErrorMessage =
        "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a digit, and a special character.";

    private static readonly Regex Pattern = PasswordPattern();

    public static bool IsValid(string? password) =>
        !string.IsNullOrEmpty(password) && Pattern.IsMatch(password);

    [GeneratedRegex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$")]
    private static partial Regex PasswordPattern();
}
