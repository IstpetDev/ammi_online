using AMMI_Online_API.Infrastructure.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace AMMI_Online_API.Tests.Files;

public class FileStoragePathServiceTests : IDisposable
{
    private readonly string _testTempDir;
    private readonly string _contentRootDir;
    private readonly Mock<IWebHostEnvironment> _envMock;

    public FileStoragePathServiceTests()
    {
        _testTempDir = Path.Combine(Path.GetTempPath(), "ammi_storage_tests_" + Guid.NewGuid().ToString("N"));
        _contentRootDir = Path.Combine(_testTempDir, "api_published");
        Directory.CreateDirectory(_contentRootDir);

        _envMock = new Mock<IWebHostEnvironment>();
        _envMock.Setup(e => e.ContentRootPath).Returns(_contentRootDir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_testTempDir))
        {
            try { Directory.Delete(_testTempDir, true); } catch { }
        }
    }

    private static IConfiguration BuildConfig(Dictionary<string, string?> values)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }

    [Fact]
    public void GetUploadsBasePath_ConfiguracionPorDefecto_QuedaFueraDeLaPublicacion()
    {
        // Arrange: sin configuración explícita, debe usar "../Uploads" relativo a ContentRootPath
        var config = BuildConfig(new Dictionary<string, string?>());
        var service = new FileStoragePathService(config, _envMock.Object);

        // Act
        var basePath = service.GetUploadsBasePath();

        // Assert: la carpeta debe quedar fuera del directorio publicado de la API
        var expected = Path.GetFullPath(Path.Combine(_contentRootDir, "../Uploads"));
        Assert.Equal(expected, basePath);
        Assert.False(basePath.StartsWith(_contentRootDir + Path.DirectorySeparatorChar),
            "La carpeta de almacenamiento debe residir fuera del directorio publicado.");
    }

    [Fact]
    public void GetUploadsBasePath_ConfiguracionRutaAbsoluta_RespetaRutaConfigurada()
    {
        // Arrange
        var customFolder = Path.Combine(_testTempDir, "custom_uploads");
        var config = BuildConfig(new Dictionary<string, string?>
        {
            ["FileSettings:UploadPath"] = customFolder
        });
        var service = new FileStoragePathService(config, _envMock.Object);

        // Act
        var basePath = service.GetUploadsBasePath();

        // Assert
        Assert.Equal(Path.GetFullPath(customFolder), basePath);
    }

    [Fact]
    public void GetTargetFolderPath_CreaCarpetaSiNoExiste_SinFallar()
    {
        // Arrange: subcarpeta nueva que aún no existe en disco
        var storageFolder = Path.Combine(_testTempDir, "uploads_storage");
        var config = BuildConfig(new Dictionary<string, string?>
        {
            ["FileSettings:UploadPath"] = storageFolder
        });
        var service = new FileStoragePathService(config, _envMock.Object);

        var subcarpeta = "documentos_personales";
        var expectedDir = Path.Combine(storageFolder, subcarpeta);
        Assert.False(Directory.Exists(expectedDir));

        // Act
        var result = service.GetTargetFolderPath(subcarpeta);

        // Assert: no lanza excepción y crea la carpeta
        Assert.True(Directory.Exists(result));
        Assert.Equal(expectedDir, result);
    }

    [Fact]
    public void ResolvePhysicalPath_ArchivoEnNuevaCarpetaConfigurada_ResuelveCorrectamente()
    {
        // Arrange: archivo nuevo guardado en la carpeta de almacenamiento externa
        var storageFolder = Path.Combine(_testTempDir, "uploads_storage");
        var targetSubfolder = Path.Combine(storageFolder, "comprobantes");
        Directory.CreateDirectory(targetSubfolder);

        var fileName = "pago-nuevo.png";
        var physicalFile = Path.Combine(targetSubfolder, fileName);
        File.WriteAllText(physicalFile, "contenido comprobante");

        var config = BuildConfig(new Dictionary<string, string?>
        {
            ["FileSettings:UploadPath"] = storageFolder
        });
        var service = new FileStoragePathService(config, _envMock.Object);

        // Act: la BD almacena "Uploads/comprobantes/pago-nuevo.png"
        var resolved = service.ResolvePhysicalPath("Uploads/comprobantes/pago-nuevo.png");

        // Assert: encuentra el archivo en la carpeta externa
        Assert.Equal(physicalFile, resolved);
        Assert.True(File.Exists(resolved));
    }

    [Fact]
    public void ResolvePhysicalPath_ArchivoLegacyEnPublicacion_ResuelveSinPerdida()
    {
        // Arrange: simula archivo antiguo que quedó en el directorio publicado original (<ContentRootPath>/Uploads)
        var legacyFolder = Path.Combine(_contentRootDir, "Uploads", "documentos_personales");
        Directory.CreateDirectory(legacyFolder);

        var fileName = "cedula-antigua.pdf";
        var legacyPhysicalFile = Path.Combine(legacyFolder, fileName);
        File.WriteAllText(legacyPhysicalFile, "contenido legacy pdf");

        // Configuración externa donde este archivo aún no ha sido migrado
        var storageFolder = Path.Combine(_testTempDir, "uploads_storage");
        var config = BuildConfig(new Dictionary<string, string?>
        {
            ["FileSettings:UploadPath"] = storageFolder
        });
        var service = new FileStoragePathService(config, _envMock.Object);

        // Act: en BD la ruta sigue siendo "Uploads/documentos_personales/cedula-antigua.pdf"
        var resolved = service.ResolvePhysicalPath("Uploads/documentos_personales/cedula-antigua.pdf");

        // Assert: no se pierde el archivo histórico, lo encuentra en la ubicación legacy
        Assert.Equal(legacyPhysicalFile, resolved);
        Assert.True(File.Exists(resolved));
    }

    [Fact]
    public void ResolvePhysicalPath_RutaSinPrefijoUploads_ResuelveCorrectamente()
    {
        // Arrange
        var storageFolder = Path.Combine(_testTempDir, "uploads_storage");
        var subDir = Path.Combine(storageFolder, "foto_perfil");
        Directory.CreateDirectory(subDir);

        var fileName = "foto.jpg";
        var physicalFile = Path.Combine(subDir, fileName);
        File.WriteAllText(physicalFile, "contenido foto");

        var config = BuildConfig(new Dictionary<string, string?>
        {
            ["FileSettings:UploadPath"] = storageFolder
        });
        var service = new FileStoragePathService(config, _envMock.Object);

        // Act: ruta en BD almacenada como "foto_perfil/foto.jpg"
        var resolved = service.ResolvePhysicalPath("foto_perfil/foto.jpg");

        // Assert
        Assert.Equal(physicalFile, resolved);
        Assert.True(File.Exists(resolved));
    }
}
