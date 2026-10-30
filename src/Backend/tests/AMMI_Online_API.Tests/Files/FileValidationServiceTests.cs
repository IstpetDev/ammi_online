using AMMI_Online_API.Application.Services.Implementations;
using Xunit;

namespace AMMI_Online_API.Tests.Files;

public class FileValidationServiceTests
{
    private readonly FileValidationService _validator = new();
    private const long Max10Mb = 10 * 1024 * 1024;

    [Fact]
    public void ValidateFile_PdfValido_RetornaExito()
    {
        // Arrange: Encabezado %PDF-1.4
        var pdfBytes = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 };
        using var stream = new MemoryStream(pdfBytes);

        // Act
        var result = _validator.ValidateFile(stream, "cedula_identidad.pdf", pdfBytes.Length, Max10Mb);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
        Assert.Equal("cedula_identidad.pdf", result.SanitizedFileName);
    }

    [Fact]
    public void ValidateFile_PngValido_RetornaExito()
    {
        // Arrange: Encabezado PNG
        var pngBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00 };
        using var stream = new MemoryStream(pngBytes);

        // Act
        var result = _validator.ValidateFile(stream, "foto_perfil.png", pngBytes.Length, Max10Mb);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
        Assert.Equal("foto_perfil.png", result.SanitizedFileName);
    }

    [Fact]
    public void ValidateFile_JpgValido_RetornaExito()
    {
        // Arrange: Encabezado JPEG
        var jpgBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46 };
        using var stream = new MemoryStream(jpgBytes);

        // Act
        var result = _validator.ValidateFile(stream, "comprobante.jpg", jpgBytes.Length, Max10Mb);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public void ValidateFile_DocxValido_RetornaExito()
    {
        // Arrange: Encabezado PK.. (.docx / .zip)
        var docxBytes = new byte[] { 0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00 };
        using var stream = new MemoryStream(docxBytes);

        // Act
        var result = _validator.ValidateFile(stream, "solicitud.docx", docxBytes.Length, Max10Mb);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public void ValidateFile_EjecutableCamufladoComoPdf_RetornaInvalido()
    {
        // Arrange: Archivo con extensión .pdf pero con firma MZ (ejecutable PE/Windows)
        var fakePdfBytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00 };
        using var stream = new MemoryStream(fakePdfBytes);

        // Act
        var result = _validator.ValidateFile(stream, "malware_disfrazado.pdf", fakePdfBytes.Length, Max10Mb);

        // Assert: Rechazo por firma incompatible / ejecutable
        Assert.False(result.IsValid);
        Assert.NotNull(result.ErrorMessage);
        Assert.Contains("ejecutable", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ValidateFile_ScriptShellCamufladoComoPng_RetornaInvalido()
    {
        // Arrange: Archivo con extensión .png pero con firma #!
        var fakePngBytes = new byte[] { 0x23, 0x21, 0x2F, 0x62, 0x69, 0x6E, 0x2F, 0x73, 0x68 };
        using var stream = new MemoryStream(fakePngBytes);

        // Act
        var result = _validator.ValidateFile(stream, "script_disfrazado.png", fakePngBytes.Length, Max10Mb);

        // Assert
        Assert.False(result.IsValid);
        Assert.NotNull(result.ErrorMessage);
    }

    [Fact]
    public void ValidateFile_TamanioExcedeLimiteMaximo_RetornaInvalido()
    {
        // Arrange: Archivo de 12MB con límite de 10MB
        var pdfHeader = new byte[] { 0x25, 0x50, 0x44, 0x46 };
        using var stream = new MemoryStream(pdfHeader);
        const long sizeExcesivo = 12 * 1024 * 1024;

        // Act
        var result = _validator.ValidateFile(stream, "archivo_pesado.pdf", sizeExcesivo, Max10Mb);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("excede el tamaño máximo permitido", result.ErrorMessage);
    }

    [Fact]
    public void ValidateFile_ArchivoVacio_RetornaInvalido()
    {
        // Arrange
        using var stream = new MemoryStream(Array.Empty<byte>());

        // Act
        var result = _validator.ValidateFile(stream, "vacio.pdf", 0, Max10Mb);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("vacío", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("script.bat")]
    [InlineData("programa.exe")]
    [InlineData("exploit.sh")]
    [InlineData("webshell.php")]
    public void ValidateFile_ExtensionNoPermitida_RetornaInvalido(string nombreArchivo)
    {
        // Arrange
        var bytes = new byte[] { 0x01, 0x02, 0x03, 0x04 };
        using var stream = new MemoryStream(bytes);

        // Act
        var result = _validator.ValidateFile(stream, nombreArchivo, bytes.Length, Max10Mb);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("Extensión no permitida", result.ErrorMessage);
    }

    [Theory]
    [InlineData("../../etc/passwd.pdf", "passwd.pdf")]
    [InlineData("..\\..\\windows\\system32\\calc.pdf", "calc.pdf")]
    [InlineData("carpeta/subcarpeta/documento.pdf", "documento.pdf")]
    public void ValidateFile_NombreConPathTraversal_SanitizaNombreCorrectamente(string nombreInseguro, string esperado)
    {
        // Arrange: Encabezado PDF válido
        var pdfBytes = new byte[] { 0x25, 0x50, 0x44, 0x46 };
        using var stream = new MemoryStream(pdfBytes);

        // Act
        var result = _validator.ValidateFile(stream, nombreInseguro, pdfBytes.Length, Max10Mb);

        // Assert
        Assert.True(result.IsValid);
        Assert.Equal(esperado, result.SanitizedFileName);
        Assert.DoesNotContain("..", result.SanitizedFileName);
        Assert.DoesNotContain("/", result.SanitizedFileName);
        Assert.DoesNotContain("\\", result.SanitizedFileName);
    }
}
