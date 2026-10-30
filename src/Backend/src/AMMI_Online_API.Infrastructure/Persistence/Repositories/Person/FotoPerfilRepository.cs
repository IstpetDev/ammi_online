using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class FotoPerfilRepository : IFotoPerfilRepository
{
    private static readonly string[] FotoAllowedExtensions = [".jpg", ".jpeg", ".png"];

    private readonly Ammi_OnlineContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly IFileValidationService _fileValidationService;

    public FotoPerfilRepository(
        Ammi_OnlineContext context,
        IWebHostEnvironment environment,
        IConfiguration configuration,
        IFileValidationService fileValidationService)
    {
        _context = context;
        _environment = environment;
        _configuration = configuration;
        _fileValidationService = fileValidationService;
    }

    private async Task<List<string>> GetFotoRequisitoCodigosAsync(CancellationToken ct)
    {
        var ids = await _context.Requisitos
            .Where(r => r.EsFoto)
            .Select(r => r.IdRequisitos)
            .ToListAsync(ct);
        return ids.Select(id => id.ToString()).ToList();
    }

    public async Task<DocumentosPersonales?> GetByDocumentoAsync(string documento, CancellationToken ct)
    {
        var fotoCodigos = await GetFotoRequisitoCodigosAsync(ct);

        return await _context.DocumentosPersonales
            .AsNoTracking()
            .Include(dp => dp.IdPersonaNavigation)
            .Include(dp => dp.IdAdjuntoNavigation)
            .Where(dp => fotoCodigos.Contains(dp.CodigoRequisito))
            .Where(dp => dp.IdPersonaNavigation != null && dp.IdPersonaNavigation.Documento == documento)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<DocumentosPersonales?> GetByPersonaIdAsync(int idPersona, CancellationToken ct)
    {
        var fotoCodigos = await GetFotoRequisitoCodigosAsync(ct);

        return await _context.DocumentosPersonales
            .AsNoTracking()
            .Include(dp => dp.IdPersonaNavigation)
            .Include(dp => dp.IdAdjuntoNavigation)
            .Where(dp => fotoCodigos.Contains(dp.CodigoRequisito))
            .Where(dp => dp.IdPersona == idPersona)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<DocumentosPersonales> UpdateFotoAsync(int idDocumentosPersonales, IFormFile archivo, CancellationToken ct)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var existing = await _context.DocumentosPersonales
                .Include(dp => dp.IdPersonaNavigation)
                .Include(dp => dp.IdAdjuntoNavigation)
                .FirstOrDefaultAsync(dp => dp.IdDocumentosPersonales == idDocumentosPersonales, ct)
                ?? throw new KeyNotFoundException("Foto de perfil no encontrada.");

            if (existing.IdAdjuntoNavigation != null)
            {
                EliminarArchivoFisico(existing.IdAdjuntoNavigation.Path);
                _context.Adjunto.Remove(existing.IdAdjuntoNavigation);
            }

            var nuevoAdjunto = await GuardarArchivoAsync(archivo, "foto_perfil", ct);
            existing.IdAdjunto = nuevoAdjunto.IdAdjunto;

            _context.DocumentosPersonales.Update(existing);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return existing;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<bool> DeleteFotoAsync(int idDocumentosPersonales, CancellationToken ct)
    {
        var existing = await _context.DocumentosPersonales
            .Include(dp => dp.IdAdjuntoNavigation)
            .FirstOrDefaultAsync(dp => dp.IdDocumentosPersonales == idDocumentosPersonales, ct);

        if (existing == null)
            return false;

        return await EliminarFotoAsync(existing, ct);
    }

    public async Task<bool> DeleteFotoAdminByDocumentoAsync(string documento, CancellationToken ct)
    {
        var fotoCodigos = await GetFotoRequisitoCodigosAsync(ct);

        var existing = await _context.DocumentosPersonales
            .Include(dp => dp.IdPersonaNavigation)
            .Include(dp => dp.IdAdjuntoNavigation)
            .Where(dp => fotoCodigos.Contains(dp.CodigoRequisito))
            .Where(dp => dp.IdPersonaNavigation != null && dp.IdPersonaNavigation.Documento == documento)
            .FirstOrDefaultAsync(ct);

        if (existing == null)
            return false;

        return await EliminarFotoAsync(existing, ct);
    }

    public async Task<bool> DeleteFotoAdminByPersonaIdAsync(int idPersona, CancellationToken ct)
    {
        var fotoCodigos = await GetFotoRequisitoCodigosAsync(ct);

        var existing = await _context.DocumentosPersonales
            .Include(dp => dp.IdAdjuntoNavigation)
            .Where(dp => fotoCodigos.Contains(dp.CodigoRequisito))
            .Where(dp => dp.IdPersona == idPersona)
            .FirstOrDefaultAsync(ct);

        if (existing == null)
            return false;

        return await EliminarFotoAsync(existing, ct);
    }

    private async Task<bool> EliminarFotoAsync(DocumentosPersonales dp, CancellationToken ct)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            if (dp.IdAdjuntoNavigation != null)
            {
                EliminarArchivoFisico(dp.IdAdjuntoNavigation.Path);
                _context.Adjunto.Remove(dp.IdAdjuntoNavigation);
            }

            dp.IdAdjunto = null;
            _context.DocumentosPersonales.Update(dp);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return true;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    private async Task<Adjunto> GuardarArchivoAsync(IFormFile archivo, string subcarpeta, CancellationToken ct)
    {
        var validation = _fileValidationService.ValidateFormFile(archivo, allowedExtensions: FotoAllowedExtensions);
        if (!validation.IsValid)
            throw new ArgumentException(validation.ErrorMessage ?? "Archivo de foto no válido");

        var sanitizedName = validation.SanitizedFileName ?? archivo.FileName;
        var fileExtension = Path.GetExtension(sanitizedName).ToLowerInvariant();

        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", subcarpeta);
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await archivo.CopyToAsync(fileStream, ct);
        }

        var adjunto = new Adjunto
        {
            Path = Path.Combine("Uploads", subcarpeta, uniqueFileName).Replace("\\", "/"),
        };

        _context.Adjunto.Add(adjunto);
        await _context.SaveChangesAsync(ct);

        return adjunto;
    }

    private void EliminarArchivoFisico(string filePath)
    {
        var fullPath = Path.Combine(_environment.ContentRootPath, filePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }
}
