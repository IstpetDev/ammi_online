using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;

public class ModuloOperacionRepository : IModuloOperacionRepository
{
    private readonly Ammi_OnlineContext _context;

    public ModuloOperacionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<ModuloOperacion?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.ModuloOperacion
            .AsNoTracking()
            .FirstOrDefaultAsync(mo => mo.IdModuloOperacion == id, cancellationToken);
    }

    public async Task<IEnumerable<ModuloOperacion>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.ModuloOperacion
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ModuloOperacion>> GetByModuloAsync(int idModulo, CancellationToken cancellationToken)
    {
        return await _context.ModuloOperacion
            .AsNoTracking()
            .Where(mo => mo.IdModulo == idModulo)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ModuloOperacion>> GetByOperacionAsync(int idOperacion, CancellationToken cancellationToken)
    {
        return await _context.ModuloOperacion
            .AsNoTracking()
            .Where(mo => mo.IdOperacion == idOperacion)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ModuloOperacion>> GetActivosAsync(CancellationToken cancellationToken)
    {
        return await _context.ModuloOperacion
            .AsNoTracking()
            .Where(mo => mo.EsActivo)
            .ToListAsync(cancellationToken);
    }

    public async Task<ModuloOperacion> AddAsync(ModuloOperacion moduloOperacion, CancellationToken cancellationToken)
    {
        await _context.ModuloOperacion.AddAsync(moduloOperacion, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return moduloOperacion;
    }

    public async Task<ModuloOperacion> UpdateAsync(ModuloOperacion moduloOperacion, CancellationToken cancellationToken)
    {
        _context.ModuloOperacion.Update(moduloOperacion);
        await _context.SaveChangesAsync(cancellationToken);
        return moduloOperacion;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.ModuloOperacion.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.ModuloOperacion.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.ModuloOperacion
            .AnyAsync(mo => mo.IdModuloOperacion == id, cancellationToken);
    }

    public async Task<ModuloOperacion?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.ModuloOperacion
            .Include(mo => mo.IdModuloNavigation)
            .Include(mo => mo.IdOperacionNavigation)
            .AsNoTracking()
            .FirstOrDefaultAsync(mo => mo.IdModuloOperacion == id, cancellationToken);
    }
}
