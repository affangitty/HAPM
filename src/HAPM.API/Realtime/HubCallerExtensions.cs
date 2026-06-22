using System.Security.Claims;
using HAPM.Domain.Enums;
using Microsoft.AspNetCore.SignalR;

namespace HAPM.API.Realtime;

public static class HubCallerExtensions
{
    public static int? GetUserId(this HubCallerContext context)
    {
        var claim = context.User?.FindFirst(ClaimTypes.NameIdentifier)
            ?? context.User?.FindFirst("sub");
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : null;
    }

    public static UserRole? GetRole(this HubCallerContext context)
    {
        var role = context.User?.FindFirst(ClaimTypes.Role)?.Value;
        return role is not null && Enum.TryParse<UserRole>(role, out var parsed) ? parsed : null;
    }
}
