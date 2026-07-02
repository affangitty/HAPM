using HAPM.Application.Idempotency;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace HAPM.API;

internal sealed class IdempotencyHeaderOperationFilter : IOperationFilter
{
  public void Apply(OpenApiOperation operation, OperationFilterContext context)
  {
    var method = context.ApiDescription.HttpMethod ?? "GET";
    var path = context.ApiDescription.RelativePath ?? string.Empty;
    var fullPath = "/api/" + path.TrimStart('/');

    if (!IdempotencyPolicy.SupportsIdempotency(method, fullPath))
      return;

    operation.Parameters ??= new List<OpenApiParameter>();
    operation.Parameters.Add(new OpenApiParameter
    {
      Name = IdempotencyPolicy.HeaderName,
      In = ParameterLocation.Header,
      Required = IdempotencyPolicy.RequiresIdempotencyKey(method, fullPath),
      Description = "Client-generated unique key (UUID recommended). Retrying the same request with the same key returns the original response.",
      Schema = new OpenApiSchema { Type = "string", MaxLength = IdempotencyPolicy.MaxKeyLength },
    });
  }
}
