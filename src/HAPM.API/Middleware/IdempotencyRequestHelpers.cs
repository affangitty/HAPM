using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HAPM.Application.Idempotency;

namespace HAPM.API.Middleware;

internal static class IdempotencyRequestHelpers
{
  public static int ResolveUserScope(ClaimsPrincipal? user)
  {
    var claim = user?.FindFirstValue(ClaimTypes.NameIdentifier) ?? user?.FindFirstValue("sub");
    return int.TryParse(claim, out var userId) ? userId : 0;
  }

  public static async Task<string> ReadRequestBodyHashAsync(HttpRequest request, CancellationToken ct)
  {
    if (request.ContentType?.StartsWith("multipart/", StringComparison.OrdinalIgnoreCase) == true)
      return IdempotencyPolicy.MultipartBodyFingerprint;

    request.EnableBuffering();
    request.Body.Position = 0;

    using var ms = new MemoryStream();
    await request.Body.CopyToAsync(ms, ct);
    request.Body.Position = 0;

    var bytes = ms.ToArray();
    return bytes.Length == 0 ? HashText(string.Empty) : HashBytes(bytes);
  }

  public static bool IsValidKey(string? key) =>
    !string.IsNullOrWhiteSpace(key) &&
    key.Length <= IdempotencyPolicy.MaxKeyLength &&
    key.All(c => char.IsLetterOrDigit(c) || c is '-' or '_');

  private static string HashText(string value) => HashBytes(Encoding.UTF8.GetBytes(value));

  private static string HashBytes(byte[] bytes)
  {
    var hash = SHA256.HashData(bytes);
    return Convert.ToHexString(hash).ToLowerInvariant();
  }
}
