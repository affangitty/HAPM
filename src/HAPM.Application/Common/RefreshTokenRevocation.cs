using HAPM.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Common;

public static class RefreshTokenRevocation
{
    public static async Task RevokeAllForUserAsync(IUnitOfWork uow, int userId, CancellationToken ct = default)
    {
        var tokens = await uow.RefreshTokens.QueryTracked()
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync(ct);

        foreach (var token in tokens)
            token.RevokedAtUtc = DateTime.UtcNow;
    }
}
