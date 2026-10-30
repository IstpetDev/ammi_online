using AMMI_Online_API.Application.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace AMMI_Online_API.Infrastructure.Services;

public class FileStoragePathService : IFileStoragePathService
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public FileStoragePathService(IConfiguration configuration, IWebHostEnvironment environment)
    {
        _configuration = configuration;
        _environment = environment;
    }

    public string GetUploadsBasePath()
    {
        var configuredPath = _configuration["FileSettings:UploadPath"]
            ?? _configuration["StorageSettings:Local:BasePath"]
            ?? "../Uploads";

        if (Path.IsPathRooted(configuredPath))
        {
            return Path.GetFullPath(configuredPath);
        }

        return Path.GetFullPath(Path.Combine(_environment.ContentRootPath, configuredPath));
    }

    public string GetTargetFolderPath(string subcarpeta)
    {
        var basePath = GetUploadsBasePath();
        var targetPath = string.IsNullOrWhiteSpace(subcarpeta)
            ? basePath
            : Path.GetFullPath(Path.Combine(basePath, subcarpeta));

        if (!Directory.Exists(targetPath))
        {
            Directory.CreateDirectory(targetPath);
        }

        return targetPath;
    }

    public string ResolvePhysicalPath(string dbPath)
    {
        if (string.IsNullOrWhiteSpace(dbPath))
            return string.Empty;

        var basePath = GetUploadsBasePath();
        var normalized = dbPath.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);

        // Si es una ruta absoluta existente
        if (Path.IsPathRooted(normalized) && File.Exists(normalized))
            return Path.GetFullPath(normalized);

        var prefixUploads = "Uploads" + Path.DirectorySeparatorChar;
        var relativeWithoutUploads = normalized;
        if (normalized.StartsWith(prefixUploads, StringComparison.OrdinalIgnoreCase))
        {
            relativeWithoutUploads = normalized.Substring(prefixUploads.Length);
        }

        // 1. Probar en la carpeta base configurada sin el prefijo "Uploads/"
        var candidate1 = Path.GetFullPath(Path.Combine(basePath, relativeWithoutUploads));
        if (File.Exists(candidate1))
            return candidate1;

        // 2. Probar en la carpeta base configurada conservando la ruta relativa
        var candidate2 = Path.GetFullPath(Path.Combine(basePath, normalized));
        if (File.Exists(candidate2))
            return candidate2;

        // 3. Probar en la ubicación legacy (dentro de ContentRootPath / directorio publicado)
        var candidateLegacy = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, normalized));
        if (File.Exists(candidateLegacy))
            return candidateLegacy;

        // 4. Probar en ContentRootPath sin prefijo Uploads
        var candidateLegacy2 = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, relativeWithoutUploads));
        if (File.Exists(candidateLegacy2))
            return candidateLegacy2;

        // Si el archivo no existe aún físicamente en disco, la ruta esperada según la nueva estructura es candidate1
        return candidate1;
    }
}
