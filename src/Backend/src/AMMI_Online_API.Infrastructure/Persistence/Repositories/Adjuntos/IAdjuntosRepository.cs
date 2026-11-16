using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Adjuntos;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Adjuntos
{
    public class IAdjuntosRepository : IAdjuntos
    {
        private readonly Ammi_OnlineContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly IFileValidationService _fileValidationService;
        private readonly IFileStoragePathService _fileStoragePathService;

        public IAdjuntosRepository(
            Ammi_OnlineContext context,
            IWebHostEnvironment environment,
            IConfiguration configuration,
            IFileValidationService fileValidationService,
            IFileStoragePathService fileStoragePathService)
        {
            _context = context;
            _environment = environment;
            _configuration = configuration;
            _fileValidationService = fileValidationService;
            _fileStoragePathService = fileStoragePathService;
        }

        public async Task<Adjunto?> GuardarArchivoAsync(IFormFile archivo, string subcarpeta, CancellationToken cancellationToken)
        {
            if (archivo == null || archivo.Length == 0)
                return null;

            try
            {
                var validation = _fileValidationService.ValidateFormFile(archivo);
                if (!validation.IsValid)
                    throw new Exception(validation.ErrorMessage ?? "Archivo no válido");

                var sanitizedName = validation.SanitizedFileName ?? archivo.FileName;
                var fileExtension = Path.GetExtension(sanitizedName).ToLowerInvariant();

                // Crear carpeta configurada por entorno si no existe (fuera de la publicación)
                var uploadsFolder = _fileStoragePathService.GetTargetFolderPath(subcarpeta);

                // Generar nombre único para el archivo
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Guardar archivo físicamente
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await archivo.CopyToAsync(fileStream, cancellationToken);
                }

                // Crear ruta relativa para guardar en BD (mantiene compatibilidad de esquema y consultas existentes)
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

            // Resuelve ruta física soportando tanto almacenamiento configurado como archivos legacy
            var fullPath = _fileStoragePathService.ResolvePhysicalPath(adjunto.Path);

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
                var fullPath = _fileStoragePathService.ResolvePhysicalPath(adjunto.Path);
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

        public async Task<Adjunto?> GetByPathAsync(string path, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(path))
                return null;

            var normalized = path.Replace('\\', '/').TrimStart('/');
            var withUploads = normalized.StartsWith("Uploads/", StringComparison.OrdinalIgnoreCase)
                ? normalized
                : "Uploads/" + normalized;
            var withoutUploads = normalized.StartsWith("Uploads/", StringComparison.OrdinalIgnoreCase)
                ? normalized.Substring("Uploads/".Length)
                : normalized;

            return await _context.Adjunto
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Path == path || a.Path == normalized || a.Path == withUploads || a.Path == withoutUploads, ct);
        }
    }
}
