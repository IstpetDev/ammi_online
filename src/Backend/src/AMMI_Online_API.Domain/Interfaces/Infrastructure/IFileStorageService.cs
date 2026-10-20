using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Domain.Interfaces.Infrastructure;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string folder, CancellationToken cancellationToken);
    Task DeleteFileAsync(string filePath, CancellationToken cancellationToken);
    Task<byte[]> GetFileAsync(string filePath, CancellationToken cancellationToken);
}