using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Services;

public class CicloService : ICicloService
{
    private readonly Ammi_OnlineContext _context;

    public CicloService(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Ciclo?> ObtenerCicloActivoVigenteAsync(CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return await _context.Ciclo
            .AsNoTracking()
            .Where(c => c.EsActivo == true)
            .Where(c => c.FechaInicioEstimada == null || c.FechaInicioEstimada <= today)
            .Where(c => c.FechaFinEstimada == null || c.FechaFinEstimada >= today)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Ciclo?> ObtenerCicloPorMallaAsync(int idMalla, CancellationToken cancellationToken = default)
    {
        var malla = await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
            .FirstOrDefaultAsync(m => m.IdMalla == idMalla, cancellationToken);

        return malla?.IdCicloNavigation;
    }

    /// <summary>
    /// Obtiene la primera especie de tipo matrícula (EsMatricula = true).
    /// Reemplaza al antiguo ObtenerPrimeraEspecieNoDiferibleAsync.
    /// </summary>
    public async Task<Especie?> ObtenerPrimeraEspecieMatriculaAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Especie
            .AsNoTracking()
            .Where(e => e.EsMatricula == true)
            .OrderBy(e => e.IdEspecie)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<EspecieCiclo?> ObtenerEspecieCicloAsync(int idMalla, int idEspecie, CancellationToken cancellationToken = default)
    {
        return await _context.EspecieCiclo
            .AsNoTracking()
            .Where(ec => ec.IdMalla == idMalla && ec.IdEspecie == idEspecie)
            .Include(ec => ec.IdEspecieNavigation)
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>
    /// Obtiene la primera especie de tipo pensión diferible (EsPension = true, EsMatricula = false).
    /// Reemplaza al antiguo ObtenerPrimeraEspecieDiferibleAsync.
    /// </summary>
    public async Task<(Especie? Especie, EspecieCiclo? EspecieCiclo)?> ObtenerPrimeraEspecieCicloMatriculaAsync(
        int idMalla, CancellationToken cancellationToken = default)
    {
        var especie = await ObtenerPrimeraEspecieMatriculaAsync(cancellationToken);
        if (especie == null) return null;

        var especieCiclo = await _context.EspecieCiclo
            .AsNoTracking()
            .Where(ec => ec.IdMalla == idMalla && ec.IdEspecie == especie.IdEspecie)
            .FirstOrDefaultAsync(cancellationToken);

        return (especie, especieCiclo);
    }

    /// <summary>
    /// Obtiene la primera especie de tipo pensión (EsPension = true, EsMatricula = false).
    /// Reemplaza al antiguo ObtenerPrimeraEspecieDiferibleAsync.
    /// </summary>
    public async Task<Especie?> ObtenerPrimeraEspeciePensionAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Especie
            .AsNoTracking()
            .Where(e => e.EsPension == true && e.EsMatricula == false)
            .OrderBy(e => e.IdEspecie)
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>
    /// Obtiene todas las especies de tipo pensión (EsPension = true, EsMatricula = false).
    /// Reemplaza al antiguo ObtenerEspeciesDiferiblesAsync.
    /// </summary>
    public async Task<List<Especie>> ObtenerEspeciesPensionAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Especie
            .AsNoTracking()
            .Where(e => e.EsPension == true && e.EsMatricula == false)
            .OrderBy(e => e.IdEspecie)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Obtiene todas las EspecieCiclo de una malla, ordenando matrícula primero.
    /// Reemplaza al antiguo ObtenerTodasEspeciesCicloAsync(int idCiclo).
    /// </summary>
    public async Task<List<EspecieCiclo>> ObtenerTodasEspeciesMallaAsync(int idMalla, CancellationToken cancellationToken = default)
    {
        return await _context.EspecieCiclo
            .AsNoTracking()
            .Where(ec => ec.IdMalla == idMalla)
            .Include(ec => ec.IdEspecieNavigation)
            .OrderByDescending(ec => ec.IdEspecieNavigation.EsMatricula)
            .ThenBy(ec => ec.IdEspecieCiclo)
            .ToListAsync(cancellationToken);
    }
}
