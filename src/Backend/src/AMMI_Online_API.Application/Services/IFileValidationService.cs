using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.Services;

public record FileValidationResult(bool IsValid, string? ErrorMessage = null, string? SanitizedFileName = null);

public interface IFileValidationService
{
    FileValidationResult ValidateFile(
        Stream contentStream,
        string fileName,
        long length,
        long? maxFileSizeBytes = null,
        IEnumerable<string>? allowedExtensions = null);

    FileValidationResult ValidateFormFile(
        IFormFile? file,
        long? maxFileSizeBytes = null,
        IEnumerable<string>? allowedExtensions = null);

    long GetMaxFileSizeForExtension(string extension, long? overrideLimit = null);
}
