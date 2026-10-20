using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;

public class RolOperacionRepository : IRolOperacionRepository
{
    private readonly Ammi_OnlineContext _context;

    public RolOperacionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<RolOperacion?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.RolOperacion
            .AsNoTracking()
            .FirstOrDefaultAsync(ro => ro.IdRolOperacion == id, cancellationToken);
    }

    public async Task<IEnumerable<RolOperacion>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.RolOperacion
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<RolOperacion>> GetByRolAsync(int idRol, CancellationToken cancellationToken)
    {
        return await _context.RolOperacion
            .AsNoTracking()
            .Where(ro => ro.IdRol == idRol)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<RolOperacion>> GetByModuloOperacionAsync(int idModuloOperacion, CancellationToken cancellationToken)
    {
        return await _context.RolOperacion
            .AsNoTracking()
            .Where(ro => ro.IdModuloOperacion == idModuloOperacion)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<RolOperacion>> GetActivosAsync(CancellationToken cancellationToken)
    {
        return await _context.RolOperacion
            .AsNoTracking()
            .Where(ro => ro.EsActivo)
            .ToListAsync(cancellationToken);
    }

    public async Task<RolOperacion> AddAsync(RolOperacion rolOperacion, CancellationToken cancellationToken)
    {
        await _context.RolOperacion.AddAsync(rolOperacion, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return rolOperacion;
    }

    public async Task<RolOperacion> UpdateAsync(RolOperacion rolOperacion, CancellationToken cancellationToken)
    {
        _context.RolOperacion.Update(rolOperacion);
        await _context.SaveChangesAsync(cancellationToken);
        return rolOperacion;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.RolOperacion.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.RolOperacion.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.RolOperacion
            .AnyAsync(ro => ro.IdRolOperacion == id, cancellationToken);
    }
}
