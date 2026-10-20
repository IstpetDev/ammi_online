using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoActividadEconomicaRepository : ITipoActividadEconomicaRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoActividadEconomicaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoActividadEconomica?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoActividadEconomica
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdtipoActividadEconomica == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoActividadEconomica>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoActividadEconomica
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoActividadEconomica> AddAsync(TipoActividadEconomica tipoActividadEconomica, CancellationToken cancellationToken)
    {
        await _context.TipoActividadEconomica.AddAsync(tipoActividadEconomica, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoActividadEconomica;
    }

    public async Task<TipoActividadEconomica> UpdateAsync(TipoActividadEconomica tipoActividadEconomica, CancellationToken cancellationToken)
    {
        _context.TipoActividadEconomica.Update(tipoActividadEconomica);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoActividadEconomica;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.TipoActividadEconomica.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.TipoActividadEconomica.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoActividadEconomica
            .AnyAsync(t => t.IdtipoActividadEconomica == id, cancellationToken);
    }
}
