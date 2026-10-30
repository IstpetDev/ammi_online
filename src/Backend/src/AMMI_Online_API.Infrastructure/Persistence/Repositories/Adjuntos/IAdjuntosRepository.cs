using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Adjuntos;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Adjuntos
{
    public class IAdjuntosRepository : IAdjuntos
    {
        private readonly Ammi_OnlineContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly AMMI_Online_API.Application.Services.IFileValidationService _fileValidationService;

        public IAdjuntosRepository(
            Ammi_OnlineContext context,
            IWebHostEnvironment environment,
            IConfiguration configuration,
            AMMI_Online_API.Application.Services.IFileValidationService fileValidationService)
        {
            _context = context;
            _environment = environment;
            _configuration = configuration;
            _fileValidationService = fileValidationService;
        }

        public async Task<Adjunto?> GuardarArchivoAsync(IFormFile archivo, string subcarpeta, CancellationToken cancellationToken)
        {
            if (archivo == null || archivo.Length == 0)
                return null;

            try
            {
                var maxFileSize = _configuration.GetValue<long>("FileSettings:MaxFileSize", 10 * 1024 * 1024);
                var allowedExtensions = _configuration.GetSection("FileSettings:AllowedExtensions").Get<string[]>()
                    ?? new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };

                using (var stream = archivo.OpenReadStream())
                {
                    var validation = _fileValidationService.ValidateFile(stream, archivo.FileName, archivo.Length, maxFileSize, allowedExtensions);
                    if (!validation.IsValid)
                        throw new Exception(validation.ErrorMessage ?? "Archivo no válido");
                }

                var fileExtension = Path.GetExtension(archivo.FileName).ToLowerInvariant();

                // Crear carpeta si no existe
                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", subcarpeta);
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // Generar nombre único para el archivo
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Guardar archivo físicamente
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await archivo.CopyToAsync(fileStream, cancellationToken);
                }

                // Crear ruta relativa para guardar en BD
                var relativePath = Path.Combine("Uploads", subcarpeta, uniqueFileName).Replace("\\", "/");

                // Guardar en la tabla Adjunto
                var adjunto = new Adjunto
                {
                    Path = relativePath
                };

                _context.Adjunto.Add(adjunto);
                await _context.SaveChangesAsync(cancellationToken);

                return adjunto;
            }
            catch (Exception ex)
            {
                // Log error
                throw new Exception($"Error al guardar el archivo: {ex.Message}", ex);
            }
        }

        public async Task<byte[]> DescargarArchivoAsync(int idAdjunto, CancellationToken cancellationToken)
        {
            var adjunto = await _context.Adjunto.FindAsync(new object[] { idAdjunto }, cancellationToken);

            if (adjunto == null)
                throw new FileNotFoundException("Archivo no encontrado");

            var fullPath = Path.Combine(_environment.ContentRootPath, adjunto.Path);

            if (!File.Exists(fullPath))
                throw new FileNotFoundException("Archivo físico no encontrado");

            return await File.ReadAllBytesAsync(fullPath, cancellationToken);
        }

        public async Task<bool> EliminarArchivoAsync(int idAdjunto, CancellationToken cancellationToken)
        {
            var adjunto = await _context.Adjunto.FindAsync(new object[] { idAdjunto }, cancellationToken);

            if (adjunto == null)
                return false;

            try
            {
                // Eliminar archivo físico
                var fullPath = Path.Combine(_environment.ContentRootPath, adjunto.Path);
                if (File.Exists(fullPath))
                    File.Delete(fullPath);

                // Eliminar registro de la base de datos
                _context.Adjunto.Remove(adjunto);
                await _context.SaveChangesAsync(cancellationToken);

                return true;
            }
            catch
            {
                // Log error
                return false;
            }
        }

        public async Task<Adjunto?> GetByIdAsync(int id, CancellationToken ct)
        {
            return await _context.Adjunto.FindAsync(new object[] { id }, ct);
        }
    }
}
