namespace AMMI_Online_API.Application.Services;

public record FileValidationResult(bool IsValid, string? ErrorMessage = null, string? SanitizedFileName = null);

public interface IFileValidationService
{
    FileValidationResult ValidateFile(
        Stream contentStream,
        string fileName,
        long length,
        long maxFileSizeBytes,
        IEnumerable<string>? allowedExtensions = null);
}
