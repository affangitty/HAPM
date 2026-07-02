using HAPM.Application.Idempotency;

namespace HAPM.Application.Tests.Idempotency;

public class IdempotencyPolicyTests
{
  [Theory]
  [InlineData("POST", "/api/auth/login", false, false)]
  [InlineData("POST", "/api/auth/register", true, true)]
  [InlineData("POST", "/api/appointments", true, true)]
  [InlineData("POST", "/api/appointments/5/confirm", true, true)]
  [InlineData("POST", "/api/invoices/3/payments", true, true)]
  [InlineData("POST", "/api/notifications/1/read", true, false)]
  [InlineData("GET", "/api/patients", false, false)]
  public void Policy_classifies_routes(string method, string path, bool supports, bool requires)
  {
    Assert.Equal(supports, IdempotencyPolicy.SupportsIdempotency(method, path));
    Assert.Equal(requires, IdempotencyPolicy.RequiresIdempotencyKey(method, path));
  }

  [Fact]
  public void NormalizePath_trims_trailing_slash_and_query()
  {
    Assert.Equal("/api/patients", IdempotencyPolicy.NormalizePath("/api/patients/?page=1"));
  }
}
