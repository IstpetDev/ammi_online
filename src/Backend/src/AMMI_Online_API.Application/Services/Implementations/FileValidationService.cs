using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace AMMI_Online_API.Application.Services.Implementations;

public class FileValidationService : IFileValidationService
{
    private static readonly string[] DefaultAllowedExtensions =
    {
        ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx"
    };

    private const long DefaultGlobalMaxFileSize = 10 * 1024 * 1024; // 10MB
    private const long DefaultImageMaxFileSize = 5 * 1024 * 1024;   // 5MB

    // Firmas conocidas de encabezado (magic numbers)
    private static readonly byte[] PdfHeader = [0x25, 0x50, 0x44, 0x46]; // %PDF
    private static readonly byte[] PngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] JpgHeader = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] ZipOrOfficeHeader = [0x50, 0x4B, 0x03, 0x04]; // PK.. (.docx, .xlsx, .zip)
    private static readonly byte[] LegacyOfficeHeader = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]; // .doc, .xls

    // Firmas ejecutables peligrosas
    private static readonly byte[] ExeHeader = [0x4D, 0x5A]; // MZ (Windows PE)
    private static readonly byte[] ElfHeader = [0x7F, 0x45, 0x4C, 0x46]; // ELF (Linux)
    private static readonly byte[] ShellScriptHeader = [0x23, 0x21]; // #!

    private readonly long _defaultMaxFileSize;
    private readonly Dictionary<string, long> _maxFileSizeByExtension = new(StringComparer.OrdinalIgnoreCase);
    private readonly HashSet<string> _configuredAllowedExtensions = new(StringComparer.OrdinalIgnoreCase);

    public FileValidationService(IConfiguration? configuration = null)
    {
        if (configuration != null)
        {
            _defaultMaxFileSize = configuration.GetValue<long>("FileSettings:MaxFileSize", DefaultGlobalMaxFileSize);

            var extensions = configuration.GetSection("FileSettings:AllowedExtensions").Get<string[]>();
            if (extensions != null && extensions.Length > 0)
            {
                foreach (var ext in extensions)
                {
                    _configuredAllowedExtensions.Add(NormalizeExtension(ext));
                }
            }

            var limitsSection = configuration.GetSection("FileSettings:MaxFileSizeByExtension").GetChildren();
            foreach (var child in limitsSection)
            {
                if (long.TryParse(child.Value, out var limitBytes))
                {
                    _maxFileSizeByExtension[NormalizeExtension(child.Key)] = limitBytes;
                }
            }
        }
        else
        {
            _defaultMaxFileSize = DefaultGlobalMaxFileSize;
            foreach (var ext in DefaultAllowedExtensions)
            {
                _configuredAllowedExtensions.Add(NormalizeExtension(ext));
            }
        }

        // Si no se configuraron límites específicos por extensión, establecer los valores seguros por defecto
        if (!_maxFileSizeByExtension.ContainsKey(".jpg")) _maxFileSizeByExtension[".jpg"] = DefaultImageMaxFileSize;
        if (!_maxFileSizeByExtension.ContainsKey(".jpeg")) _maxFileSizeByExtension[".jpeg"] = DefaultImageMaxFileSize;
        if (!_maxFileSizeByExtension.ContainsKey(".png")) _maxFileSizeByExtension[".png"] = DefaultImageMaxFileSize;
        if (!_maxFileSizeByExtension.ContainsKey(".pdf")) _maxFileSizeByExtension[".pdf"] = _defaultMaxFileSize;
        if (!_maxFileSizeByExtension.ContainsKey(".doc")) _maxFileSizeByExtension[".doc"] = _defaultMaxFileSize;
        if (!_maxFileSizeByExtension.ContainsKey(".docx")) _maxFileSizeByExtension[".docx"] = _defaultMaxFileSize;
    }

    public long GetMaxFileSizeForExtension(string extension, long? overrideLimit = null)
    {
        var normalized = NormalizeExtension(extension);

        if (overrideLimit.HasValue && overrideLimit.Value > 0)
        {
            if (_maxFileSizeByExtension.TryGetValue(normalized, out var extLimit))
            {
                return Math.Min(extLimit, overrideLimit.Value);
            }
            return overrideLimit.Value;
        }

        if (_maxFileSizeByExtension.TryGetValue(normalized, out var configuredLimit))
        {
            return configuredLimit;
        }

        return _defaultMaxFileSize;
    }

    public FileValidationResult ValidateFormFile(
        IFormFile? file,
        long? maxFileSizeBytes = null,
        IEnumerable<string>? allowedExtensions = null)
    {
        if (file == null || file.Length <= 0)
        {
            return new FileValidationResult(false, "El archivo está vacío o no fue proporcionado.");
        }

        using var stream = file.OpenReadStream();
        return ValidateFile(stream, file.FileName, file.Length, maxFileSizeBytes, allowedExtensions);
    }

    public FileValidationResult ValidateFile(
        Stream contentStream,
        string fileName,
        long length,
        long? maxFileSizeBytes = null,
        IEnumerable<string>? allowedExtensions = null)
    {
        if (contentStream == null || length <= 0)
        {
            return new FileValidationResult(false, "El archivo está vacío o no fue proporcionado.");
        }

        if (string.IsNullOrWhiteSpace(fileName))
        {
            return new FileValidationResult(false, "El nombre de archivo no es válido.");
        }

        // Sanitización del nombre de archivo y protección contra Path Traversal
        var sanitized = SanitizeFileName(fileName);
        if (string.IsNullOrWhiteSpace(sanitized))
        {
            return new FileValidationResult(false, "El nombre de archivo contiene caracteres ilegales o no permitidos.");
        }

        var extension = Path.GetExtension(sanitized).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension))
        {
            return new FileValidationResult(false, "El archivo no tiene una extensión válida.");
        }

        // Resolución de extensiones permitidas
        var allowed = (allowedExtensions ?? (_configuredAllowedExtensions.Count > 0 ? _configuredAllowedExtensions : DefaultAllowedExtensions))
            .Select(NormalizeExtension)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (!allowed.Contains(extension))
        {
            return new FileValidationResult(false, $"Extensión no permitida: '{extension}'. Extensiones permitidas: {string.Join(", ", allowed)}.");
        }

        // Validación de tamaño máximo (respetando límite por tipo/extensión)
        var effectiveMaxSizeBytes = GetMaxFileSizeForExtension(extension, maxFileSizeBytes);
        if (length > effectiveMaxSizeBytes)
        {
            var maxMb = effectiveMaxSizeBytes / (1024 * 1024);
            return new FileValidationResult(false, $"El archivo excede el tamaño máximo permitido de {maxMb}MB.");
        }

        // Validación de magic numbers
        var header = ReadHeaderBytes(contentStream, 16);
        if (header.Length == 0)
        {
            return new FileValidationResult(false, "No se pudo leer la firma del archivo.");
        }

        // Rechazo inmediato de ejecutables y scripts camuflados
        if (MatchesSignature(header, ExeHeader) || MatchesSignature(header, ElfHeader) || MatchesSignature(header, ShellScriptHeader))
        {
            return new FileValidationResult(false, "El archivo contiene una firma ejecutable o script no permitida.");
        }

        // Validación específica según extensión
        bool signatureMatches = extension switch
        {
            ".pdf" => MatchesSignature(header, PdfHeader),
            ".png" => MatchesSignature(header, PngHeader),
            ".jpg" or ".jpeg" => MatchesSignature(header, JpgHeader),
            ".docx" or ".xlsx" => MatchesSignature(header, ZipOrOfficeHeader),
            ".doc" or ".xls" => MatchesSignature(header, LegacyOfficeHeader),
            _ => true
        };

        if (!signatureMatches)
        {
            return new FileValidationResult(false, $"El contenido real del archivo no coincide con su extensión declarada '{extension}'.");
        }

        return new FileValidationResult(true, SanitizedFileName: sanitized);
    }

    private static string NormalizeExtension(string extension)
    {
        if (string.IsNullOrWhiteSpace(extension)) return string.Empty;
        var ext = extension.Trim().ToLowerInvariant();
        return ext.StartsWith('.') ? ext : $".{ext}";
    }

    private static string SanitizeFileName(string fileName)
    {
        // Normalizar separadores de directorios para soporte multiplataforma (Windows/Linux)
        var normalized = fileName.Replace('\\', '/');

        // Quitar rutas de directorio (../../ o C:/)
        var justName = Path.GetFileName(normalized);

        // Quitar '..' residuales para evitar cualquier intento de evasión de path traversal
        while (justName.Contains(".."))
        {
            justName = justName.Replace("..", "");
        }

        // Quitar caracteres de control y caracteres inválidos del sistema de archivos
        var invalidChars = Path.GetInvalidFileNameChars();
        var cleanChars = justName.Where(c => !invalidChars.Contains(c) && !char.IsControl(c)).ToArray();

        var result = new string(cleanChars).Trim();
        return result.TrimStart('.');
    }

    private static byte[] ReadHeaderBytes(Stream stream, int maxBytes)
    {
        if (!stream.CanRead)
            return Array.Empty<byte>();

        long originalPos = stream.CanSeek ? stream.Position : 0;
        try
        {
            if (stream.CanSeek)
                stream.Position = 0;

            var buffer = new byte[maxBytes];
            int read = stream.Read(buffer, 0, maxBytes);
            if (read < maxBytes)
            {
                Array.Resize(ref buffer, read);
            }
            return buffer;
        }
        finally
        {
            if (stream.CanSeek)
                stream.Position = originalPos;
        }
    }

    private static bool MatchesSignature(byte[] header, byte[] signature)
    {
        if (header.Length < signature.Length)
            return false;

        for (int i = 0; i < signature.Length; i++)
        {
            if (header[i] != signature[i])
                return false;
        }

        return true;
    }
}
