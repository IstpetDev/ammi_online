using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class ParroquiaRepository : IParroquiaRepository
{
    private readonly Ammi_OnlineContext _context;

    public ParroquiaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Parroquia?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Parroquia
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdParroquia == id, cancellationToken);
    }

    public async Task<IEnumerable<Parroquia>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Parroquia
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Parroquia>> GetByCantonAsync(int idCanton, CancellationToken cancellationToken)
    {
        return await _context.Parroquia
            .AsNoTracking()
            .Where(p => p.IdCanton == idCanton)
            .ToListAsync(cancellationToken);
    }

    public async Task<Parroquia> AddAsync(Parroquia parroquia, CancellationToken cancellationToken)
    {
        await _context.Parroquia.AddAsync(parroquia, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return parroquia;
    }

    public async Task<Parroquia> UpdateAsync(Parroquia parroquia, CancellationToken cancellationToken)
    {
        _context.Parroquia.Update(parroquia);
        await _context.SaveChangesAsync(cancellationToken);
        return parroquia;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var parroquia = await _context.Parroquia.FindAsync(new object[] { id }, cancellationToken);

        if (parroquia == null)
            return false;

        _context.Parroquia.Remove(parroquia);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Parroquia
            .AnyAsync(p => p.IdParroquia == id, cancellationToken);
    }
}
