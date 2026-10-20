using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Infrastructure;

public class DetalleMallaRepository : IDetalleMallaRepository
{
    private readonly Ammi_OnlineContext _context;

    public DetalleMallaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<DetalleMalla?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .Include(dm => dm.IdMateriaNavigation)
            .Include(dm => dm.IdPlantillaEvaluacionNavigation)
            .Include(dm => dm.IdAreaCompetenciaNavigation)
            .Include(dm => dm.IdMallaNavigation)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdParaleloNavigation)
            .FirstOrDefaultAsync(dm => dm.IdDetalleMalla == id, cancellationToken);
    }

    public async Task<IEnumerable<DetalleMalla>> GetByMallaIdAsync(int idMalla, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .Where(dm => dm.IdMalla == idMalla)
            .Include(dm => dm.IdMateriaNavigation)
            .Include(dm => dm.IdPlantillaEvaluacionNavigation)
            .Include(dm => dm.IdAreaCompetenciaNavigation)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdParaleloNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DetalleMalla>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .Include(dm => dm.IdMateriaNavigation)
            .Include(dm => dm.IdPlantillaEvaluacionNavigation)
            .Include(dm => dm.IdAreaCompetenciaNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DetalleMalla>> GetByMallaIdPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .Where(dm => dm.IdMalla == idMalla)
            .Include(dm => dm.IdMateriaNavigation)
            .Include(dm => dm.IdPlantillaEvaluacionNavigation)
            .Include(dm => dm.IdAreaCompetenciaNavigation)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdParaleloNavigation)
            .OrderBy(dm => dm.IdDetalleMalla)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountByMallaIdAsync(int idMalla, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .AsNoTracking()
            .CountAsync(dm => dm.IdMalla == idMalla, cancellationToken);
    }

    public async Task<DetalleMalla> AddAsync(DetalleMalla detalleMalla, CancellationToken cancellationToken)
    {
        _context.DetalleMalla.Add(detalleMalla);
        await _context.SaveChangesAsync(cancellationToken);
        return detalleMalla;
    }

    public async Task<IEnumerable<DetalleMalla>> AddRangeAsync(IEnumerable<DetalleMalla> detallesMalla, CancellationToken cancellationToken)
    {
        _context.DetalleMalla.AddRange(detallesMalla);
        await _context.SaveChangesAsync(cancellationToken);
        return detallesMalla;
    }

    public async Task<DetalleMalla> UpdateAsync(DetalleMalla detalleMalla, CancellationToken cancellationToken)
    {
        _context.Entry(detalleMalla).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);
        return detalleMalla;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.DetalleMalla.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
            return false;

        _context.DetalleMalla.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla.AnyAsync(dm => dm.IdDetalleMalla == id, cancellationToken);
    }

    public async Task<bool> ExistsMateriaInMallaAsync(int idMalla, int idMateria, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .AnyAsync(dm => dm.IdMalla == idMalla && dm.IdMateria == idMateria, cancellationToken);
    }
}
