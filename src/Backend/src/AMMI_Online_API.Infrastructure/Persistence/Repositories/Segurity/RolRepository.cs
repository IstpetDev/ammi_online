using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;

public class RolRepository : IRolRepository
{
    private readonly Ammi_OnlineContext _context;

    public RolRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Rol?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Rol
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.IdRol == id, cancellationToken);
    }

    public async Task<IEnumerable<Rol>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Rol
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Rol> AddAsync(Rol rol, CancellationToken cancellationToken)
    {
        await _context.Rol.AddAsync(rol, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return rol;
    }

    public async Task<Rol> UpdateAsync(Rol rol, CancellationToken cancellationToken)
    {
        _context.Rol.Update(rol);
        await _context.SaveChangesAsync(cancellationToken);
        return rol;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.Rol.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.Rol.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Rol
            .AnyAsync(r => r.IdRol == id, cancellationToken);
    }
}
