using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;

public class RolUsuarioRepository : IRolUsuarioRepository
{
    private readonly Ammi_OnlineContext _context;

    public RolUsuarioRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<RolUsuario?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.RolUsuario
            .AsNoTracking()
            .FirstOrDefaultAsync(ru => ru.IdRolUsuario == id, cancellationToken);
    }

    public async Task<IEnumerable<RolUsuario>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.RolUsuario
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<RolUsuario>> GetByRolAsync(int idRol, CancellationToken cancellationToken)
    {
        return await _context.RolUsuario
            .AsNoTracking()
            .Where(ru => ru.IdRol == idRol)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<RolUsuario>> GetByPersonaAsync(int idPersona, CancellationToken cancellationToken)
    {
        return await _context.RolUsuario
            .AsNoTracking()
            .Where(ru => ru.IdPersona == idPersona)
            .ToListAsync(cancellationToken);
    }

    public async Task<RolUsuario> AddAsync(RolUsuario rolUsuario, CancellationToken cancellationToken)
    {
        await _context.RolUsuario.AddAsync(rolUsuario, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return rolUsuario;
    }

    public async Task<RolUsuario> UpdateAsync(RolUsuario rolUsuario, CancellationToken cancellationToken)
    {
        _context.RolUsuario.Update(rolUsuario);
        await _context.SaveChangesAsync(cancellationToken);
        return rolUsuario;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.RolUsuario.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.RolUsuario.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.RolUsuario
            .AnyAsync(ru => ru.IdRolUsuario == id, cancellationToken);
    }
}
