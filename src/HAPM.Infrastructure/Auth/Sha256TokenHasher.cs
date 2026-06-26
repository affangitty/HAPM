using System.Security.Cryptography;
using System.Text;
using HAPM.Application.Interfaces;

namespace HAPM.Infrastructure.Auth;

public sealed class Sha256TokenHasher : ITokenHasher
{
    public string Hash(string token) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
