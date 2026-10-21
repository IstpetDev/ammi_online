using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class EspecieCicloRepository : IEspecieCicloRepository
{
    private readonly Ammi_OnlineContext _context;

    public EspecieCicloRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EspecieCiclo>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.EspecieCiclo
            .Include(ec => ec.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
            .Include(ec => ec.IdEspecieNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<EspecieCiclo>> GetByMallaAsync(int idMalla, CancellationToken cancellationToken)
    {
        return await _context.EspecieCiclo
            .Include(ec => ec.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
            .Include(ec => ec.IdEspecieNavigation)
            .Where(ec => ec.IdMalla == idMalla 
                      && (ec.IdEspecieNavigation.EsMatricula || ec.IdEspecieNavigation.EsPension))
            .ToListAsync(cancellationToken);
    }

    public async Task<EspecieCiclo?> GetByIdAsync(int idEspecieCiclo, CancellationToken cancellationToken)
    {
        return await _context.EspecieCiclo
            .Include(ec => ec.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
            .Include(ec => ec.IdEspecieNavigation)
            .FirstOrDefaultAsync(ec => ec.IdEspecieCiclo == idEspecieCiclo, cancellationToken);
    }

    public async Task<bool> ExisteEspecieEnMallaAsync(int idMalla, int idEspecie, CancellationToken cancellationToken)
    {
        return await _context.EspecieCiclo
            .AnyAsync(ec => ec.IdMalla == idMalla && ec.IdEspecie == idEspecie, cancellationToken);
    }

    public async Task<bool> EsMallaConCicloActivoAsync(int idMalla, CancellationToken cancellationToken)
    {
        return await _context.Malla
            .Include(m => m.IdCicloNavigation)
            .AnyAsync(m => m.IdMalla == idMalla && m.IdCicloNavigation != null && m.IdCicloNavigation.EsActivo, cancellationToken);
    }

    public async Task<EspecieCiclo> CreateAsync(EspecieCiclo especieCiclo, CancellationToken cancellationToken)
    {
        await _context.EspecieCiclo.AddAsync(especieCiclo, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(especieCiclo.IdEspecieCiclo, cancellationToken)
               ?? especieCiclo;
    }

    public async Task<EspecieCiclo> UpdateValorAsync(int idEspecieCiclo, int idEspecie, decimal valorEspecie, CancellationToken cancellationToken)
    {
        var especieCiclo = await _context.EspecieCiclo
            .FirstOrDefaultAsync(ec => ec.IdEspecieCiclo == idEspecieCiclo, cancellationToken);

        if (especieCiclo == null)
            throw new KeyNotFoundException($"EspecieCiclo con ID {idEspecieCiclo} no encontrado");

        especieCiclo.IdEspecie = idEspecie;
        especieCiclo.ValorEspecie = valorEspecie;
        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(idEspecieCiclo, cancellationToken)
               ?? especieCiclo;
    }
}
