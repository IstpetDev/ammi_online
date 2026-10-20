using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class RegimenRepository : IRegimen
{
    private readonly Ammi_OnlineContext _context;
    public RegimenRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Regimen>> FindAsync(
        int? idRegimen,
        string? detalle,
        CancellationToken cancellationToken)
    {
        IQueryable<Regimen> query =
            _context.Regimen.AsNoTracking();
        if (idRegimen.HasValue)
            query = query.Where(x => x.IdRegimen == idRegimen.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(x => x.Detalle.Contains(detalle));
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Regimen?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Regimen.FirstOrDefaultAsync(
            x => x.IdRegimen == id, cancellationToken);
    }

    public async Task<Regimen> AddAsync(Regimen regimen, CancellationToken cancellationToken)
    {
        await _context.Regimen.AddAsync(regimen, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return regimen;
    }

    public async Task<Regimen> UpdateAsync(Regimen regimen, CancellationToken cancellationToken)
    {
        _context.Regimen.Update(regimen);
        await _context.SaveChangesAsync(cancellationToken);
        return regimen;
    }
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var regimen = await _context.Regimen.FindAsync(new object[] { id }, cancellationToken);
        if (regimen == null)
            return false;
        _context.Regimen.Remove(regimen);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Regimen.AnyAsync(x => x.IdRegimen == id, cancellationToken);
    }
}
