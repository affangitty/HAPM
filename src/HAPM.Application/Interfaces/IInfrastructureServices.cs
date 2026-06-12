using HAPM.Domain.Entities;
using HAPM.Domain.Enums;

namespace HAPM.Application.Interfaces;

public interface ICurrentUserService
{
    int? UserId { get; }
    string? Email { get; }
    UserRole? Role { get; }
    bool IsInRole(UserRole role);
}

public interface ITokenService
{
    string CreateAccessToken(User user);
    string CreateRefreshTokenValue();
    int AccessTokenMinutes { get; }
    int RefreshTokenDays { get; }
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public record StoredFile(string RelativePath, long SizeBytes);

public interface IFileStorageService
{
    /// <summary>Persists the stream and returns the relative storage path.</summary>
    Task<StoredFile> SaveAsync(Stream content, string originalFileName, string subFolder, CancellationToken ct = default);
    Stream OpenRead(string relativePath);
    void Delete(string relativePath);
}
