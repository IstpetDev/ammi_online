using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class CantonRepository : ICantonRepository
{
    private readonly Ammi_OnlineContext _context;

    public CantonRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Canton?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Canton
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdCanton == id, cancellationToken);
    }

    public async Task<IEnumerable<Canton>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Canton
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Canton>> GetByProvinciaAsync(int idProvincia, CancellationToken cancellationToken)
    {
        return await _context.Canton
            .AsNoTracking()
            .Where(c => c.IdProvincia == idProvincia)
            .ToListAsync(cancellationToken);
    }

    public async Task<Canton> AddAsync(Canton canton, CancellationToken cancellationToken)
    {
        await _context.Canton.AddAsync(canton, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return canton;
    }

    public async Task<Canton> UpdateAsync(Canton canton, CancellationToken cancellationToken)
    {
        _context.Canton.Update(canton);
        await _context.SaveChangesAsync(cancellationToken);
        return canton;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var canton = await _context.Canton.FindAsync(new object[] { id }, cancellationToken);

        if (canton == null)
            return false;

        _context.Canton.Remove(canton);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Canton
            .AnyAsync(c => c.IdCanton == id, cancellationToken);
    }
}
