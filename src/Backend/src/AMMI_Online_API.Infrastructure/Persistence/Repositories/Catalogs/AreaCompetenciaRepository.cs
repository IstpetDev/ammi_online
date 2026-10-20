using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class AreaCompetenciaRepository : IAreaCompetencia
{
    private readonly Ammi_OnlineContext _context;

    public AreaCompetenciaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AreaCompetencia>> FindAsync(
        int? idAreaCompetencia,
        int? idArea,
        string? detalle,
        CancellationToken cancellationToken)
    {
        var query = _context.AreaCompetencia.AsNoTracking().AsQueryable();

        if (idAreaCompetencia.HasValue)
            query = query.Where(x => x.IdAreaCompetencia == idAreaCompetencia.Value);
        if (idArea.HasValue)
            query = query.Where(x => x.IdArea == idArea.Value);
        if (!string.IsNullOrWhiteSpace(detalle))
            query = query.Where(x => x.Detalle.Contains(detalle));

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<AreaCompetencia?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.AreaCompetencia
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdAreaCompetencia == id, cancellationToken);
    }

    public async Task<AreaCompetencia> AddAsync(AreaCompetencia areaCompetencia, CancellationToken cancellationToken)
    {
        await _context.AreaCompetencia.AddAsync(areaCompetencia, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return areaCompetencia;
    }

    public async Task<AreaCompetencia> UpdateAsync(AreaCompetencia areaCompetencia, CancellationToken cancellationToken)
    {
        _context.AreaCompetencia.Update(areaCompetencia);
        await _context.SaveChangesAsync(cancellationToken);
        return areaCompetencia;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var areaCompetencia = await _context.AreaCompetencia.FindAsync(new object[] { id }, cancellationToken);

        if (areaCompetencia == null)
            return false;

        _context.AreaCompetencia.Remove(areaCompetencia);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.AreaCompetencia
            .AnyAsync(x => x.IdAreaCompetencia == id, cancellationToken);
    }
}
