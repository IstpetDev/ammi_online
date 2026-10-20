using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class ProvinciaRepository : IProvinciaRepository
{
    private readonly Ammi_OnlineContext _context;

    public ProvinciaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Provincia?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Provincia
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdProvincia == id, cancellationToken);
    }

    public async Task<IEnumerable<Provincia>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Provincia
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Provincia>> GetByPaisAsync(int idPais, CancellationToken cancellationToken)
    {
        return await _context.Provincia
            .AsNoTracking()
            .Where(p => p.IdPais == idPais)
            .ToListAsync(cancellationToken);
    }

    public async Task<Provincia> AddAsync(Provincia provincia, CancellationToken cancellationToken)
    {
        await _context.Provincia.AddAsync(provincia, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return provincia;
    }

    public async Task<Provincia> UpdateAsync(Provincia provincia, CancellationToken cancellationToken)
    {
        _context.Provincia.Update(provincia);
        await _context.SaveChangesAsync(cancellationToken);
        return provincia;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var provincia = await _context.Provincia.FindAsync(new object[] { id }, cancellationToken);

        if (provincia == null)
            return false;

        _context.Provincia.Remove(provincia);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Provincia
            .AnyAsync(p => p.IdProvincia == id, cancellationToken);
    }
}
