using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly Ammi_OnlineContext _context;

    public UsuarioRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Usuario?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdPersona == id, cancellationToken);
    }

    public async Task<IEnumerable<Usuario>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Usuario> AddAsync(Usuario usuario, CancellationToken cancellationToken)
    {
        await _context.Usuario.AddAsync(usuario, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return usuario;
    }

    public async Task<Usuario> UpdateAsync(Usuario usuario, CancellationToken cancellationToken)
    {
        _context.Usuario.Update(usuario);
        await _context.SaveChangesAsync(cancellationToken);
        return usuario;
    }

    public async Task<Usuario> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.Usuario.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
            throw new KeyNotFoundException("Usuario no encontrado");
        _context.Usuario.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .AnyAsync(u => u.IdPersona == id, cancellationToken);
    }
}
