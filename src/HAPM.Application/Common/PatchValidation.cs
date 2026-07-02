using System.Reflection;

namespace HAPM.Application.Common;

public static class PatchValidation
{
    public static void EnsureAnyFieldSet<T>(T patch) where T : class
    {
        if (patch is null)
            throw new BadRequestException("Request body is required.");

        var hasValue = typeof(T)
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Any(p => p.GetValue(patch) is not null);

        if (!hasValue)
            throw new BadRequestException("At least one field must be provided for a PATCH request.");
    }
}
