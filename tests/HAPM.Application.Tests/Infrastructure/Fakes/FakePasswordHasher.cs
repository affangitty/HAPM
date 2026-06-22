using HAPM.Application.Interfaces;

namespace HAPM.Application.Tests.Infrastructure.Fakes;

/// <summary>Deterministic hasher for tests - stores passwords prefixed with "hash:".</summary>
public sealed class FakePasswordHasher : IPasswordHasher
{
    public string Hash(string password) => $"hash:{password}";

    public bool Verify(string password, string hash) => hash == Hash(password);
}
