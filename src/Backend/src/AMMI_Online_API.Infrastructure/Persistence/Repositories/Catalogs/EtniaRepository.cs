using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class EtniaRepository : IEtniaRepository
{
    private readonly Ammi_OnlineContext _context;

    public EtniaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Etnia?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Etnia
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdEtnia == id, cancellationToken);
    }

    public async Task<IEnumerable<Etnia>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Etnia
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Etnia> AddAsync(Etnia etnia, CancellationToken cancellationToken)
    {
        await _context.Etnia.AddAsync(etnia, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return etnia;
    }

    public async Task<Etnia> UpdateAsync(Etnia etnia, CancellationToken cancellationToken)
    {
        _context.Etnia.Update(etnia);
        await _context.SaveChangesAsync(cancellationToken);
        return etnia;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var etnia = await _context.Etnia.FindAsync(new object[] { id }, cancellationToken);

        if (etnia == null)
            return false;

        _context.Etnia.Remove(etnia);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Etnia
            .AnyAsync(e => e.IdEtnia == id, cancellationToken);
    }
}
