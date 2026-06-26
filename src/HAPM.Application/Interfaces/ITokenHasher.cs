namespace HAPM.Application.Interfaces;

public interface ITokenHasher
{
    string Hash(string token);
}
