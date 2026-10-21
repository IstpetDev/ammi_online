using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class PlantillaEstructuraRepository : IPlantillaEstructuraRepository
{
    private readonly Ammi_OnlineContext _context;

    public PlantillaEstructuraRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<PlantillaEstructura?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PlantillaEstructura
            .Include(pe => pe.IdTipoPlantillaEstrucutraNavigation)
            .FirstOrDefaultAsync(pe => pe.IdPlantillaEstructura == id, cancellationToken);
    }

    public async Task<IEnumerable<PlantillaEstructura>> GetByPlantillaIdAsync(int idPlantillaEvaluacion, CancellationToken cancellationToken)
    {
        return await _context.PlantillaEstructura
            .Where(pe => pe.IdPlantillaEvaluacion == idPlantillaEvaluacion)
            .Include(pe => pe.IdTipoPlantillaEstrucutraNavigation)
            .Include(pe => pe.ReglasCalculo)
                .ThenInclude(r => r.IdTipoReglaCalculoNavigation)
            .OrderBy(pe => pe.Orden)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<PlantillaEstructura>> GetHijosAsync(int idNodoPadre, CancellationToken cancellationToken)
    {
        return await _context.PlantillaEstructura
            .Where(pe => pe.IdNodoPadre == idNodoPadre)
            .Include(pe => pe.IdTipoPlantillaEstrucutraNavigation)
            .OrderBy(pe => pe.Orden)
            .ToListAsync(cancellationToken);
    }

    public async Task<PlantillaEstructura> AddAsync(PlantillaEstructura entity, CancellationToken cancellationToken)
    {
        _context.PlantillaEstructura.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<IEnumerable<PlantillaEstructura>> AddRangeAsync(IEnumerable<PlantillaEstructura> entities, CancellationToken cancellationToken)
    {
        _context.PlantillaEstructura.AddRange(entities);
        await _context.SaveChangesAsync(cancellationToken);
        return entities;
    }

    public async Task<PlantillaEstructura> UpdateAsync(PlantillaEstructura entity, CancellationToken cancellationToken)
    {
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.PlantillaEstructura.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null) return false;

        _context.PlantillaEstructura.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteRangeAsync(IEnumerable<PlantillaEstructura> entities, CancellationToken cancellationToken)
    {
        _context.PlantillaEstructura.RemoveRange(entities);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
