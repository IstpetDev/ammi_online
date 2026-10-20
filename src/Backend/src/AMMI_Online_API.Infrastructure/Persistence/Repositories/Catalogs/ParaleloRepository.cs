using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class ParaleloRepository : IParalelo
{
    private readonly Ammi_OnlineContext _context;
    public ParaleloRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Paralelo>> FindAsync (
        int? idParalelo,
        string? nombreParalelo,
        int? cupoMaximo,
        CancellationToken cancellationToken)
    {
        IQueryable<Paralelo> query =
            _context.Paralelo.AsNoTracking();
        if (idParalelo.HasValue)
            query = query.Where(x => x.IdParalelo == idParalelo.Value);
        if (!string.IsNullOrEmpty(nombreParalelo))
            query = query.Where(x => x.NombreParalelo.Contains(nombreParalelo));
        if (cupoMaximo.HasValue)
            query = query.Where(x => x.CupoMaximo == cupoMaximo.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Paralelo?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Paralelo.FirstOrDefaultAsync(
            x => x.IdParalelo == id, cancellationToken);
    }

    public async Task<Paralelo> AddAsync(Paralelo paralelo, CancellationToken cancellationToken)
    {
        await _context.Paralelo.AddAsync(paralelo, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return paralelo;
    }

    public async Task<Paralelo> UpdateAsync(Paralelo paralelo, CancellationToken cancellationToken)
    {
        _context.Paralelo.Update(paralelo);
        await _context.SaveChangesAsync(cancellationToken);
        return paralelo;
    }
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var paralelo = await _context.Paralelo.FindAsync(new object[] { id }, cancellationToken);
        if (paralelo == null)
            return false;
        _context.Paralelo.Remove(paralelo);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Paralelo.AnyAsync(x => x.IdParalelo == id, cancellationToken);
    }
}
