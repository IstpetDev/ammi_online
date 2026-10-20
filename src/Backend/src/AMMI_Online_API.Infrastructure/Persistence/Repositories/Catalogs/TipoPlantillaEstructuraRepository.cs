using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoPlantillaEstructuraRepository : ITipoPlantillaEstructuraRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoPlantillaEstructuraRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoPlantillaEstrucutra?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoPlantillaEstrucutra
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTipoPlantillaEstrucutra == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoPlantillaEstrucutra>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoPlantillaEstrucutra
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoPlantillaEstrucutra> AddAsync(TipoPlantillaEstrucutra tipoPlantillaEstructura, CancellationToken cancellationToken)
    {
        await _context.TipoPlantillaEstrucutra.AddAsync(tipoPlantillaEstructura, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoPlantillaEstructura;
    }

    public async Task<TipoPlantillaEstrucutra> UpdateAsync(TipoPlantillaEstrucutra tipoPlantillaEstructura, CancellationToken cancellationToken)
    {
        _context.TipoPlantillaEstrucutra.Update(tipoPlantillaEstructura);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoPlantillaEstructura;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.TipoPlantillaEstrucutra.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.TipoPlantillaEstrucutra.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoPlantillaEstrucutra
            .AnyAsync(t => t.IdTipoPlantillaEstrucutra == id, cancellationToken);
    }
}
