using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;

public class ModuloRepository : IModuloRepository
{
    private readonly Ammi_OnlineContext _context;

    public ModuloRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Modulo?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Modulo
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.IdModulo == id, cancellationToken);
    }

    public async Task<IEnumerable<Modulo>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Modulo
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Modulo> AddAsync(Modulo modulo, CancellationToken cancellationToken)
    {
        await _context.Modulo.AddAsync(modulo, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return modulo;
    }

    public async Task<Modulo> UpdateAsync(Modulo modulo, CancellationToken cancellationToken)
    {
        _context.Modulo.Update(modulo);
        await _context.SaveChangesAsync(cancellationToken);
        return modulo;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.Modulo.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.Modulo.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Modulo
            .AnyAsync(m => m.IdModulo == id, cancellationToken);
    }
}
