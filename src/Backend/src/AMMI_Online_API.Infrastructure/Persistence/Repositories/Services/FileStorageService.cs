using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly IFileValidationService _fileValidationService;
    private readonly IFileStoragePathService _fileStoragePathService;

    public FileStorageService(
        IWebHostEnvironment environment,
        IFileValidationService fileValidationService,
        IFileStoragePathService fileStoragePathService)
    {
        _environment = environment;
        _fileValidationService = fileValidationService;
        _fileStoragePathService = fileStoragePathService;
    }

    public async Task<string> SaveFileAsync(IFormFile file, string folder, CancellationToken cancellationToken)
    {
        var validation = _fileValidationService.ValidateFormFile(file);
        if (!validation.IsValid)
            throw new ArgumentException(validation.ErrorMessage ?? "El archivo no es válido");

        var sanitizedName = validation.SanitizedFileName ?? file.FileName;
        var extension = Path.GetExtension(sanitizedName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{extension}";

        // Definir la ruta de guardado configurada fuera de la publicación
        var uploadPath = _fileStoragePathService.GetTargetFolderPath(folder);
        var filePath = Path.Combine(uploadPath, fileName);

        // Guardar archivo
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        // Retornar ruta relativa o nombre del archivo
        return Path.Combine("uploads", folder, fileName).Replace("\\", "/");
    }

    public Task DeleteFileAsync(string filePath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(filePath))
            return Task.CompletedTask;

        var fullPath = _fileStoragePathService.ResolvePhysicalPath(filePath);

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    public async Task<byte[]> GetFileAsync(string filePath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(filePath))
            return Array.Empty<byte>();

        var fullPath = _fileStoragePathService.ResolvePhysicalPath(filePath);

        if (!File.Exists(fullPath))
            return Array.Empty<byte>();

        return await File.ReadAllBytesAsync(fullPath, cancellationToken);
    }
}
