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
        var fechaActual = DateOnly.FromDateTime(DateTime.UtcNow);

        return await _context.Ciclo
            .AsNoTracking()
            .Where(c => c.EsActivo == true)
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

    public async Task<Especie?> ObtenerPrimeraEspecieNoDiferibleAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Especie
            .AsNoTracking()
            .Where(e => e.EsDiferible == false)
            .OrderBy(e => e.IdEspecie) // Ordenar para obtener la primera especie
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<EspecieCiclo?> ObtenerEspecieCicloAsync(int idCiclo, int idEspecie, CancellationToken cancellationToken = default)
    {
        return await _context.EspecieCiclo
            .AsNoTracking()
            .Where(ec => ec.IdCiclo == idCiclo &&
                        ec.IdEspecie == idEspecie)
            .Include(ec => ec.IdEspecieNavigation) // Incluir la especie para validar
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<(Especie? Especie, EspecieCiclo? EspecieCiclo)?> ObtenerPrimeraEspecieCicloNoDiferibleAsync(
    CancellationToken cancellationToken = default)
    {
        // 1. Obtener ciclo activo
        var cicloActivo = await ObtenerCicloActivoVigenteAsync(cancellationToken);
        if (cicloActivo == null) return null;

        // 2. Obtener primera especie no diferible
        var especie = await _context.Especie
            .AsNoTracking()
            .Where(e => e.EsDiferible == false)
            .OrderBy(e => e.IdEspecie)
            .FirstOrDefaultAsync(cancellationToken);

        if (especie == null) return null;

        // 3. Obtener EspecieCiclo correspondiente
        var especieCiclo = await _context.EspecieCiclo
            .AsNoTracking()
            .Where(ec => ec.IdCiclo == cicloActivo.IdCiclo &&
                        ec.IdEspecie == especie.IdEspecie)
            .FirstOrDefaultAsync(cancellationToken);

        return (especie, especieCiclo);
    }
    public async Task<Especie?> ObtenerPrimeraEspecieDiferibleAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Especie
            .AsNoTracking()
            .Where(e => e.EsDiferible == true)
            .OrderBy(e => e.IdEspecie)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<Especie>> ObtenerEspeciesDiferiblesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Especie
            .AsNoTracking()
            .Where(e => e.EsDiferible == true)
            .OrderBy(e => e.IdEspecie)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<EspecieCiclo>> ObtenerTodasEspeciesCicloAsync(int idCiclo, CancellationToken cancellationToken = default)
    {
        return await _context.EspecieCiclo
            .AsNoTracking()
            .Where(ec => ec.IdCiclo == idCiclo)
            .Include(ec => ec.IdEspecieNavigation)
            .OrderBy(ec => ec.IdEspecieNavigation.EsDiferible) 
            .ToListAsync(cancellationToken);
    }
}