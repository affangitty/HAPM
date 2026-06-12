using HAPM.Application.Common;
using HAPM.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace HAPM.Infrastructure.Storage;

/// <summary>
/// Stores uploads on the local file system. Swap with an Azure Blob Storage
/// implementation of <see cref="IFileStorageService"/> for cloud deployments.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _rootPath;

    public LocalFileStorageService(IConfiguration configuration)
    {
        _rootPath = configuration["FileStorage:RootPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads");
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<StoredFile> SaveAsync(Stream content, string originalFileName, string subFolder, CancellationToken ct = default)
    {
        var safeName = $"{Guid.NewGuid():N}{Path.GetExtension(originalFileName).ToLowerInvariant()}";
        var folder = Path.Combine(_rootPath, subFolder);
        Directory.CreateDirectory(folder);

        var fullPath = Path.Combine(folder, safeName);
        await using (var target = File.Create(fullPath))
        {
            await content.CopyToAsync(target, ct);
        }

        var size = new FileInfo(fullPath).Length;
        return new StoredFile(Path.Combine(subFolder, safeName).Replace('\\', '/'), size);
    }

    public Stream OpenRead(string relativePath)
    {
        var fullPath = ResolvePath(relativePath);
        if (!File.Exists(fullPath))
            throw new NotFoundException("The stored file could not be found on disk.");

        return File.OpenRead(fullPath);
    }

    public void Delete(string relativePath)
    {
        var fullPath = ResolvePath(relativePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }

    private string ResolvePath(string relativePath)
    {
        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, relativePath));
        if (!fullPath.StartsWith(Path.GetFullPath(_rootPath), StringComparison.OrdinalIgnoreCase))
            throw new BadRequestException("Invalid file path.");
        return fullPath;
    }
}
