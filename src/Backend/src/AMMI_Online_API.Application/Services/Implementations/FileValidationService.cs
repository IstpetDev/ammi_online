namespace AMMI_Online_API.Application.Services.Implementations;

public class FileValidationService : IFileValidationService
{
    private static readonly string[] DefaultAllowedExtensions =
    {
        ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx"
    };

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

    public FileValidationResult ValidateFile(
        Stream contentStream,
        string fileName,
        long length,
        long maxFileSizeBytes,
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

        if (length > maxFileSizeBytes)
        {
            var maxMb = maxFileSizeBytes / (1024 * 1024);
            return new FileValidationResult(false, $"El archivo excede el tamaño máximo permitido de {maxMb}MB.");
        }

        // Sanitización del nombre de archivo y protección contra Path Traversal
        var sanitized = SanitizeFileName(fileName);
        if (string.IsNullOrWhiteSpace(sanitized))
        {
            return new FileValidationResult(false, "El nombre de archivo contiene caracteres ilegales o no permitidos.");
        }

        var extension = Path.GetExtension(sanitized).ToLowerInvariant();
        var allowed = (allowedExtensions ?? DefaultAllowedExtensions)
            .Select(e => e.StartsWith('.') ? e.ToLowerInvariant() : $".{e.ToLowerInvariant()}")
            .ToHashSet();

        if (!allowed.Contains(extension))
        {
            return new FileValidationResult(false, $"Extensión no permitida: '{extension}'. Extensiones permitidas: {string.Join(", ", allowed)}.");
        }

        // Validación de magic numbers
        var header = ReadHeaderBytes(contentStream, 16);
        if (header.Length == 0)
        {
            return new FileValidationResult(false, "No se pudo leer la firma del archivo.");
        }

        // Rechazo inmediato de ejecutables camuflados
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
            ".doc" or ".xls" => MatchesSignature(header, LegacyOfficeHeader) || MatchesSignature(header, ZipOrOfficeHeader),
            _ => true
        };

        if (!signatureMatches)
        {
            return new FileValidationResult(false, $"El contenido real del archivo no coincide con su extensión declarada '{extension}'.");
        }

        return new FileValidationResult(true, SanitizedFileName: sanitized);
    }

    private static string SanitizeFileName(string fileName)
    {
        // Quitar rutas de directorio (../../ o C:\)
        var justName = Path.GetFileName(fileName);

        // Quitar '..' residuales
        justName = justName.Replace("..", "");

        // Quitar caracteres no permitidos
        var invalidChars = Path.GetInvalidFileNameChars();
        var cleanChars = justName.Where(c => !invalidChars.Contains(c)).ToArray();

        return new string(cleanChars).Trim();
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
