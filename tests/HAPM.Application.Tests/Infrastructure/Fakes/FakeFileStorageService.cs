using HAPM.Application.Interfaces;

namespace HAPM.Application.Tests.Infrastructure.Fakes;

public sealed class FakeFileStorageService : IFileStorageService
{
    private readonly Dictionary<string, byte[]> _files = new(StringComparer.OrdinalIgnoreCase);

    public Task<StoredFile> SaveAsync(Stream content, string originalFileName, string subFolder, CancellationToken ct = default)
    {
        using var ms = new MemoryStream();
        content.CopyTo(ms);
        var bytes = ms.ToArray();
        var path = $"{subFolder}/{Guid.NewGuid():N}{Path.GetExtension(originalFileName).ToLowerInvariant()}".Replace('\\', '/');
        _files[path] = bytes;
        return Task.FromResult(new StoredFile(path, bytes.Length));
    }

    public Stream OpenRead(string relativePath)
    {
        if (!_files.TryGetValue(relativePath, out var bytes))
            throw new FileNotFoundException(relativePath);

        return new MemoryStream(bytes);
    }

    public void Delete(string relativePath) => _files.Remove(relativePath);

    public bool Contains(string relativePath) => _files.ContainsKey(relativePath);
}
