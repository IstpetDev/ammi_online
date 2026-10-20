using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;

    public FileStorageService(IWebHostEnvironment environment )
    {
        _environment = environment;
    }

    public async Task<string> SaveFileAsync(IFormFile file, string folder, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("El archivo está vacío");

        // Crear nombre único para el archivo
        var extension = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{extension}";

        // Definir la ruta de guardado
        var uploadPath = Path.Combine(_environment.ContentRootPath, "uploads", folder);

        // Crear directorio si no existe
        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath);

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

        var fullPath = Path.Combine(_environment.WebRootPath, filePath);

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    public async Task<byte[]> GetFileAsync(string filePath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(filePath))
            return null;

        var fullPath = Path.Combine(_environment.WebRootPath, filePath);

        if (!File.Exists(fullPath))
            return null;

        return await File.ReadAllBytesAsync(fullPath, cancellationToken);
    }
}