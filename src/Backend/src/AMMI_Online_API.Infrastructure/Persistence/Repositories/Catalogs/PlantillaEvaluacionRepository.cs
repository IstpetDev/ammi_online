using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class PlantillaEvaluacionRepository : IPlantillaEvaluacionRepository
{
    private readonly Ammi_OnlineContext _context;

    public PlantillaEvaluacionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<PlantillaEvaluacion?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PlantillaEvaluacion
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdPlantillaEvaluacion == id, cancellationToken);
    }

    public async Task<IEnumerable<PlantillaEvaluacion>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.PlantillaEvaluacion
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<PlantillaEvaluacion>> GetActivosAsync(CancellationToken cancellationToken)
    {
        return await _context.PlantillaEvaluacion
            .AsNoTracking()
            .Where(e => e.EsActivo)
            .ToListAsync(cancellationToken);
    }

    public async Task<PlantillaEvaluacion> AddAsync(PlantillaEvaluacion plantillaEvaluacion, CancellationToken cancellationToken)
    {
        await _context.PlantillaEvaluacion.AddAsync(plantillaEvaluacion, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return plantillaEvaluacion;
    }

    public async Task<PlantillaEvaluacion> UpdateAsync(PlantillaEvaluacion plantillaEvaluacion, CancellationToken cancellationToken)
    {
        _context.PlantillaEvaluacion.Update(plantillaEvaluacion);
        await _context.SaveChangesAsync(cancellationToken);
        return plantillaEvaluacion;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.PlantillaEvaluacion.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.PlantillaEvaluacion.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PlantillaEvaluacion
            .AnyAsync(e => e.IdPlantillaEvaluacion == id, cancellationToken);
    }
}
