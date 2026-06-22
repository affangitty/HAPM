using HAPM.Application.Interfaces;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Infrastructure.Fakes;

public sealed class FakeCurrentUser : ICurrentUserService
{
    public int? UserId { get; set; }
    public string? Email { get; set; }
    public UserRole? Role { get; set; }

    public bool IsInRole(UserRole role) => Role == role;

    public void As(UserRole role, int userId, string? email = null)
    {
        Role = role;
        UserId = userId;
        Email = email;
    }
}
