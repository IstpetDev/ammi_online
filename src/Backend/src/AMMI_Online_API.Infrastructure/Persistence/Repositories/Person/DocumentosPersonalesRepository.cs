using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class DocumentosPersonalesRepository : IDocumentosPersonales
{
    private readonly Ammi_OnlineContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly IFileValidationService _fileValidationService;
    private readonly IFileStoragePathService _fileStoragePathService;

    public DocumentosPersonalesRepository(
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

    public async Task<IEnumerable<DocumentosPersonales>> FindAsync(
        int? idDocumentosPersonales = null,
        int? idPersona = null,
        int? idTipoDocumentoPersonal = null,
        int? idAdjunto = null,
        string? codigoRequisito = null,
        bool? estado = null,
        bool? valorDato = null,
        string? observacion = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<DocumentosPersonales> query = _context.DocumentosPersonales
            .Include(x => x.IdAdjuntoNavigation)
            .AsNoTracking();

        if (idDocumentosPersonales.HasValue)
            query = query.Where(x => x.IdDocumentosPersonales == idDocumentosPersonales.Value);
        if (idPersona.HasValue)
            query = query.Where(x => x.IdPersona == idPersona.Value);
        if (idTipoDocumentoPersonal.HasValue)
            query = query.Where(x => x.IdTipoDocumentoPersonal == idTipoDocumentoPersonal.Value);
        if (idAdjunto.HasValue)
            query = query.Where(x => x.IdAdjunto == idAdjunto.Value);
        if (!string.IsNullOrEmpty(codigoRequisito))
            query = query.Where(x => x.CodigoRequisito == codigoRequisito);
        if (estado.HasValue)
            query = query.Where(x => x.Estado == estado);
        if (valorDato.HasValue)
            query = query.Where(x => x.ValorDato == valorDato);
        if (!string.IsNullOrEmpty(observacion))
            query = query.Where(x => x.Observacion == observacion);

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<DocumentosPersonales> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var documentosPersonales = await _context.DocumentosPersonales
            .Include(dp => dp.IdAdjuntoNavigation)
            .FirstOrDefaultAsync(x => x.IdDocumentosPersonales == id, cancellationToken);

        if (documentosPersonales == null)
            throw new KeyNotFoundException("Documento personal no encontrado.");

        return documentosPersonales;
    }

    public async Task<DocumentosPersonales> AddAsync(DocumentosPersonales documentosPersonales, CancellationToken cancellationToken)
    {
        var existing = await _context.DocumentosPersonales
            .FirstOrDefaultAsync(
                x => x.IdTipoDocumentoPersonal == documentosPersonales.IdTipoDocumentoPersonal &&
                     x.IdPersona == documentosPersonales.IdPersona,
                cancellationToken);

        if (existing != null)
            throw new InvalidOperationException("El documento personal ya existe para esta persona.");

        await _context.DocumentosPersonales.AddAsync(documentosPersonales, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return documentosPersonales;
    }

    public async Task<DocumentosPersonales> AddWithFileAsync(DocumentosPersonales documentosPersonales, IFormFile? archivo, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            // Guardar archivo si existe
            if (archivo != null && archivo.Length > 0)
            {
                var adjunto = await GuardarArchivoAsync(archivo, "documentos_personales", cancellationToken);
                documentosPersonales.IdAdjunto = adjunto.IdAdjunto;
            }

            // Agregar el documento personal
            await _context.DocumentosPersonales.AddAsync(documentosPersonales, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return documentosPersonales;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<DocumentosPersonales> UpdateAsync(DocumentosPersonales documentosPersonales, CancellationToken cancellationToken)
    {
        var existing = await _context.DocumentosPersonales
            .FirstOrDefaultAsync(x => x.IdDocumentosPersonales == documentosPersonales.IdDocumentosPersonales, cancellationToken);

        if (existing == null)
            throw new KeyNotFoundException("Documento personal no encontrado.");

        // Actualizar propiedades
        existing.IdTipoDocumentoPersonal = documentosPersonales.IdTipoDocumentoPersonal;
        existing.IdPersona = documentosPersonales.IdPersona;
        existing.IdAdjunto = documentosPersonales.IdAdjunto;
        existing.CodigoRequisito = documentosPersonales.CodigoRequisito;
        existing.Estado = documentosPersonales.Estado;
        existing.ValorDato = documentosPersonales.ValorDato;
        existing.Observacion = documentosPersonales.Observacion;

        _context.DocumentosPersonales.Update(existing);
        await _context.SaveChangesAsync(cancellationToken);

        return existing;
    }

    public async Task<DocumentosPersonales> UpdateWithFileAsync(int id, DocumentosPersonales documentosPersonales, IFormFile? archivo, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var existing = await _context.DocumentosPersonales
                .Include(dp => dp.IdAdjuntoNavigation)
                .FirstOrDefaultAsync(x => x.IdDocumentosPersonales == id, cancellationToken);

            if (existing == null)
                throw new KeyNotFoundException("Documento personal no encontrado.");

            // Manejar archivos solo si se proporciona uno nuevo
            if (archivo != null)
            {
                // Si hay un archivo nuevo
                if (archivo.Length > 0)
                {
                    // Eliminar archivo anterior si existe
                    if (existing.IdAdjunto.HasValue)
                    {
                        var adjuntoAnterior = await _context.Adjunto
                            .FirstOrDefaultAsync(a => a.IdAdjunto == existing.IdAdjunto.Value, cancellationToken);

                        if (adjuntoAnterior != null)
                        {
                            // Eliminar archivo físico
                            EliminarArchivoFisico(adjuntoAnterior.Path);

                            // Eliminar registro de la base de datos
                            _context.Adjunto.Remove(adjuntoAnterior);
                        }
                    }

                    // Guardar nuevo archivo
                    var nuevoAdjunto = await GuardarArchivoAsync(archivo, "documentos_personales", cancellationToken);
                    documentosPersonales.IdAdjunto = nuevoAdjunto.IdAdjunto;
                }
                // Si se envía un archivo vacío (para eliminar el adjunto)
                else if (archivo.Length == 0)
                {
                    // Eliminar archivo anterior si existe
                    if (existing.IdAdjunto.HasValue)
                    {
                        var adjuntoAnterior = await _context.Adjunto
                            .FirstOrDefaultAsync(a => a.IdAdjunto == existing.IdAdjunto.Value, cancellationToken);

                        if (adjuntoAnterior != null)
                        {
                            EliminarArchivoFisico(adjuntoAnterior.Path);
                            _context.Adjunto.Remove(adjuntoAnterior);
                        }
                    }
                    documentosPersonales.IdAdjunto = null;
                }
            }
            else
            {
                // Si no se envía archivo, mantener el adjunto actual
                documentosPersonales.IdAdjunto = existing.IdAdjunto;
            }

            // Actualizar propiedades
            existing.IdTipoDocumentoPersonal = documentosPersonales.IdTipoDocumentoPersonal;
            existing.IdPersona = documentosPersonales.IdPersona;
            existing.IdAdjunto = documentosPersonales.IdAdjunto;
            existing.CodigoRequisito = documentosPersonales.CodigoRequisito;
            existing.Estado = documentosPersonales.Estado;
            existing.ValorDato = documentosPersonales.ValorDato;
            existing.Observacion = documentosPersonales.Observacion;

            _context.DocumentosPersonales.Update(existing);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return existing;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<DocumentosPersonales> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var existing = await _context.DocumentosPersonales
            .FirstOrDefaultAsync(x => x.IdDocumentosPersonales == id, cancellationToken);

        if (existing == null)
            throw new KeyNotFoundException("Documento personal no encontrado.");

        _context.DocumentosPersonales.Remove(existing);
        await _context.SaveChangesAsync(cancellationToken);

        return existing;
    }

    public async Task<DocumentosPersonales> DeleteWithFileAsync(int id, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var existing = await _context.DocumentosPersonales
                .Include(dp => dp.IdAdjuntoNavigation)
                .FirstOrDefaultAsync(x => x.IdDocumentosPersonales == id, cancellationToken);

            if (existing == null)
                throw new KeyNotFoundException("Documento personal no encontrado.");

            // Eliminar archivo físico si existe
            if (existing.IdAdjuntoNavigation != null)
            {
                EliminarArchivoFisico(existing.IdAdjuntoNavigation.Path);

                // Eliminar registro del adjunto
                _context.Adjunto.Remove(existing.IdAdjuntoNavigation);
            }

            // Eliminar el documento personal
            _context.DocumentosPersonales.Remove(existing);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return existing;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.DocumentosPersonales
            .AnyAsync(x => x.IdDocumentosPersonales == id, cancellationToken);
    }

    // Método centralizado para guardar archivo validado mediante IFileValidationService
    private async Task<Adjunto> GuardarArchivoAsync(
        IFormFile archivo,
        string subcarpeta,
        CancellationToken cancellationToken)
    {
        var validation = _fileValidationService.ValidateFormFile(archivo);
        if (!validation.IsValid)
            throw new ArgumentException(validation.ErrorMessage ?? "Archivo no válido");

        var sanitizedName = validation.SanitizedFileName ?? archivo.FileName;
        var fileExtension = Path.GetExtension(sanitizedName).ToLowerInvariant();

        // Crear carpeta si no existe (fuera del directorio de publicación)
        var uploadsFolder = _fileStoragePathService.GetTargetFolderPath(subcarpeta);

        // Generar nombre único para el archivo
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        // Guardar archivo físicamente
        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await archivo.CopyToAsync(fileStream, cancellationToken);
        }

        // Crear registro en la tabla Adjunto
        var adjunto = new Adjunto
        {
            Path = Path.Combine("Uploads", subcarpeta, uniqueFileName).Replace("\\", "/"),
        };

        _context.Adjunto.Add(adjunto);
        await _context.SaveChangesAsync(cancellationToken);

        return adjunto;
    }

    // Método para eliminar archivo físico
    private void EliminarArchivoFisico(string filePath)
    {
        var fullPath = _fileStoragePathService.ResolvePhysicalPath(filePath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }
}
