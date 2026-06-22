using HAPM.Application.Interfaces;
using HAPM.Domain.Entities;

namespace HAPM.Application.Tests.Infrastructure.Fakes;

public sealed class FakeTokenService : ITokenService
{
    private int _refreshCounter;

    public int AccessTokenMinutes { get; } = 60;
    public int RefreshTokenDays { get; } = 7;

    public string CreateAccessToken(User user) => $"access-token-{user.Id}";

    public string CreateRefreshTokenValue() => $"refresh-token-{++_refreshCounter}";
}
