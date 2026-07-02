using HAPM.Application.Idempotency;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Middleware;

/// <summary>
/// Captures and replays idempotent write requests using the <c>Idempotency-Key</c> header.
/// </summary>
public class IdempotencyMiddleware
{
  private readonly RequestDelegate _next;

  public IdempotencyMiddleware(RequestDelegate next) => _next = next;

  public async Task InvokeAsync(HttpContext context, IIdempotencyService idempotency)
  {
    var method = context.Request.Method;
    var path = context.Request.Path.Value ?? "/";

    if (!IdempotencyPolicy.SupportsIdempotency(method, path))
    {
      await _next(context);
      return;
    }

    var key = context.Request.Headers[IdempotencyPolicy.HeaderName].FirstOrDefault()?.Trim();
    var requiresKey = IdempotencyPolicy.RequiresIdempotencyKey(method, path);

    if (string.IsNullOrWhiteSpace(key))
    {
      if (requiresKey)
      {
        await WriteProblemAsync(context, StatusCodes.Status400BadRequest,
          $"{IdempotencyPolicy.HeaderName} header is required for this endpoint.");
        return;
      }

      await _next(context);
      return;
    }

    if (!IdempotencyRequestHelpers.IsValidKey(key))
    {
      await WriteProblemAsync(context, StatusCodes.Status400BadRequest,
        $"{IdempotencyPolicy.HeaderName} must be 1-{IdempotencyPolicy.MaxKeyLength} characters and contain only letters, digits, hyphens, or underscores.");
      return;
    }

    var userScope = IdempotencyRequestHelpers.ResolveUserScope(context.User);
    var bodyHash = await IdempotencyRequestHelpers.ReadRequestBodyHashAsync(context.Request, context.RequestAborted);
    var begin = await idempotency.BeginAsync(
      key,
      userScope,
      method,
      path,
      bodyHash,
      context.RequestAborted);

    switch (begin.Kind)
    {
      case IdempotencyBeginKind.Replay:
        await WriteReplayAsync(context, begin);
        return;
      case IdempotencyBeginKind.PayloadMismatch:
        await WriteProblemAsync(context, StatusCodes.Status422UnprocessableEntity,
          "The same idempotency key was used with a different request payload.");
        return;
      case IdempotencyBeginKind.InProgress:
        await WriteProblemAsync(context, StatusCodes.Status409Conflict,
          "A request with this idempotency key is already being processed.");
        return;
    }

    var recordId = begin.RecordId!.Value;
    var originalBody = context.Response.Body;
    await using var buffer = new MemoryStream();
    context.Response.Body = buffer;

    try
    {
      await _next(context);

      buffer.Position = 0;
      var responseText = await new StreamReader(buffer, leaveOpen: true).ReadToEndAsync(context.RequestAborted);
      await idempotency.CompleteAsync(
        recordId,
        context.Response.StatusCode,
        responseText,
        context.Response.ContentType,
        context.RequestAborted);

      buffer.Position = 0;
      await buffer.CopyToAsync(originalBody, context.RequestAborted);
    }
    catch
    {
      await idempotency.FailAsync(recordId, context.RequestAborted);
      throw;
    }
    finally
    {
      context.Response.Body = originalBody;
    }
  }

  private static async Task WriteReplayAsync(HttpContext context, IdempotencyBeginResult begin)
  {
    context.Response.StatusCode = begin.ReplayStatusCode ?? StatusCodes.Status200OK;
    if (!string.IsNullOrEmpty(begin.ReplayContentType))
      context.Response.ContentType = begin.ReplayContentType;

    context.Response.Headers["Idempotent-Replayed"] = "true";
    await context.Response.WriteAsync(begin.ReplayBody ?? string.Empty);
  }

  private static async Task WriteProblemAsync(HttpContext context, int statusCode, string detail)
  {
    if (context.Response.HasStarted)
      return;

    context.Response.Clear();
    context.Response.StatusCode = statusCode;
    context.Response.ContentType = "application/problem+json";

    var problem = new ProblemDetails
    {
      Status = statusCode,
      Title = statusCode switch
      {
        400 => "Bad Request",
        409 => "Conflict",
        422 => "Unprocessable Entity",
        _ => "Error"
      },
      Detail = detail,
      Instance = context.Request.Path
    };

    await context.Response.WriteAsJsonAsync(problem);
  }
}
