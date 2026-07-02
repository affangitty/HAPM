namespace HAPM.Application.Idempotency;

/// <summary>
/// Defines which HTTP routes participate in idempotency-key handling.
/// </summary>
public static class IdempotencyPolicy
{
  public const string HeaderName = "Idempotency-Key";
  public const int MaxKeyLength = 128;
  public const string MultipartBodyFingerprint = "multipart";
  public static readonly TimeSpan Retention = TimeSpan.FromHours(24);

  private static readonly HashSet<string> ExcludedExactPaths = new(StringComparer.OrdinalIgnoreCase)
  {
    "/api/auth/login",
    "/api/auth/refresh",
  };

  private static readonly string[] RequiredPathPrefixes =
  [
    "/api/auth/register",
    "/api/appointments",
    "/api/patients",
    "/api/doctors",
    "/api/users/receptionists",
    "/api/invoices",
    "/api/prescriptions",
    "/api/reviews",
    "/api/waitlist",
  ];

  public static bool IsMutatingMethod(string method) =>
    method is "POST" or "PUT" or "PATCH";

  public static bool IsExcluded(string method, string path)
  {
    if (!IsMutatingMethod(method))
      return true;

    var normalized = NormalizePath(path);
    return ExcludedExactPaths.Contains(normalized);
  }

  public static bool SupportsIdempotency(string method, string path) =>
    !IsExcluded(method, path);

  public static bool RequiresIdempotencyKey(string method, string path)
  {
    if (!SupportsIdempotency(method, path))
      return false;

    var normalized = NormalizePath(path);
    return RequiredPathPrefixes.Any(prefix =>
      normalized.Equals(prefix, StringComparison.OrdinalIgnoreCase) ||
      normalized.StartsWith(prefix + "/", StringComparison.OrdinalIgnoreCase));
  }

  public static string NormalizePath(string path)
  {
    if (string.IsNullOrWhiteSpace(path))
      return "/";

    var value = path.Split('?', 2)[0].TrimEnd('/');
    return string.IsNullOrEmpty(value) ? "/" : value;
  }
}
