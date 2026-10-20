using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class PaisRepository : IPaisRepository
{
    private readonly Ammi_OnlineContext _context;

    public PaisRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Pais?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Pais
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPais == id, cancellationToken);
    }

    public async Task<IEnumerable<Pais>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Pais
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Pais> AddAsync(Pais pais, CancellationToken cancellationToken)
    {
        await _context.Pais.AddAsync(pais, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return pais;
    }

    public async Task<Pais> UpdateAsync(Pais pais, CancellationToken cancellationToken)
    {
        _context.Pais.Update(pais);
        await _context.SaveChangesAsync(cancellationToken);
        return pais;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var pais = await _context.Pais.FindAsync(new object[] { id }, cancellationToken);

        if (pais == null)
            return false;

        _context.Pais.Remove(pais);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Pais
            .AnyAsync(p => p.IdPais == id, cancellationToken);
    }
}
