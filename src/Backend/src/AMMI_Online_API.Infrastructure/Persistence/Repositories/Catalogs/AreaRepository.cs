using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class AreaRepository : IArea
{
    private readonly Ammi_OnlineContext _context;

    public AreaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Area>> FindAsync(
        int? idArea,
        string? detalle,
        CancellationToken cancellationToken)
    {
        var query = _context.Area.AsNoTracking().AsQueryable();

        if (idArea.HasValue)
            query = query.Where(x => x.IdArea == idArea.Value);
        if (!string.IsNullOrWhiteSpace(detalle))
            query = query.Where(x => x.Detalle.Contains(detalle));

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Area?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Area
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdArea == id, cancellationToken);
    }

    public async Task<Area> AddAsync(Area area, CancellationToken cancellationToken)
    {
        await _context.Area.AddAsync(area, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return area;
    }

    public async Task<Area> UpdateAsync(Area area, CancellationToken cancellationToken)
    {
        _context.Area.Update(area);
        await _context.SaveChangesAsync(cancellationToken);
        return area;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var area = await _context.Area.FindAsync(new object[] { id }, cancellationToken);

        if (area == null)
            return false;

        _context.Area.Remove(area);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Area
            .AnyAsync(x => x.IdArea == id, cancellationToken);
    }
}
