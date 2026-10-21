using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Infrastructure;

public class MallaRepository : IMallaRepository
{
    private readonly Ammi_OnlineContext _context;

    public MallaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Malla?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Malla
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdMalla == id, cancellationToken);
    }

    public async Task<IEnumerable<Malla>> GetAllAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
                .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.DetalleMalla)
            .Where(m => m.IdCicloNavigation == null ||
                        (m.IdCicloNavigation.EsActivo &&
                         (m.IdCicloNavigation.FechaFinEstimada == null || m.IdCicloNavigation.FechaFinEstimada >= today)))
            .OrderByDescending(m => m.IdCicloNavigation.EsActivo)
            .ThenBy(m => m.IdCursosNavigation.Orden)
            .ThenBy(m => m.IdMalla)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Malla>> GetAllPagedAsync(int? idMalla, string? detalle, int? idCursos, int? idCiclo, int pageNumber, int pageSize, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        IQueryable<Malla> query = _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
                .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.DetalleMalla);

        if (idMalla.HasValue)
            query = query.Where(m => m.IdMalla == idMalla.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(m => m.Detalle.Contains(detalle));
        if (idCursos.HasValue)
            query = query.Where(m => m.IdCursos == idCursos.Value);
        if (idCiclo.HasValue)
            query = query.Where(m => m.IdCiclo == idCiclo.Value);

        query = query.Where(m => m.IdCicloNavigation == null ||
                                 (m.IdCicloNavigation.EsActivo &&
                                  (m.IdCicloNavigation.FechaFinEstimada == null || m.IdCicloNavigation.FechaFinEstimada >= today)));

        return await query
            .OrderByDescending(m => m.IdCicloNavigation.EsActivo)
            .ThenBy(m => m.IdCursosNavigation.Orden)
            .ThenBy(m => m.IdMalla)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAllAsync(int? idMalla, string? detalle, int? idCursos, int? idCiclo, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        IQueryable<Malla> query = _context.Malla.AsNoTracking();

        if (idMalla.HasValue)
            query = query.Where(m => m.IdMalla == idMalla.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(m => m.Detalle.Contains(detalle));
        if (idCursos.HasValue)
            query = query.Where(m => m.IdCursos == idCursos.Value);
        if (idCiclo.HasValue)
            query = query.Where(m => m.IdCiclo == idCiclo.Value);

        query = query.Where(m => m.IdCicloNavigation == null ||
                                 (m.IdCicloNavigation.EsActivo &&
                                  (m.IdCicloNavigation.FechaFinEstimada == null || m.IdCicloNavigation.FechaFinEstimada >= today)));

        return await query.CountAsync(cancellationToken);
    }

    public async Task<Malla> AddAsync(Malla malla, CancellationToken cancellationToken)
    {
        await _context.Malla.AddAsync(malla, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return malla;
    }

    public async Task<Malla> UpdateAsync(Malla malla, CancellationToken cancellationToken)
    {
        _context.Malla.Update(malla);
        await _context.SaveChangesAsync(cancellationToken);
        return malla;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.Malla.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.Malla.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Malla
            .AnyAsync(e => e.IdMalla == id, cancellationToken);
    }

    public async Task<IEnumerable<Malla>> GetByTipoOfertaWithActiveCicloAsync(int idTipoOferta, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
                .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.DetalleMalla)
            .Where(m => m.IdCicloNavigation != null && m.IdCicloNavigation.IdTipoOferta == idTipoOferta)
            .Where(m => m.IdCicloNavigation.EsActivo)
            .Where(m => m.IdCicloNavigation.FechaFinEstimada == null || m.IdCicloNavigation.FechaFinEstimada >= today)
            .OrderBy(m => m.IdCursosNavigation.Orden)
            .ThenBy(m => m.IdMalla)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Malla>> GetByCicloIdAsync(int idCiclo, CancellationToken cancellationToken)
    {
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
                .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.DetalleMalla)
            .Where(m => m.IdCiclo == idCiclo)
            .OrderBy(m => m.IdCursosNavigation.Orden)
            .ThenBy(m => m.IdMalla)
            .ToListAsync(cancellationToken);
    }

    public async Task<Malla?> GetByIdWithRelationsAsync(int idMalla, CancellationToken cancellationToken)
    {
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
                .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.IdCursosNavigation)
            .FirstOrDefaultAsync(m => m.IdMalla == idMalla, cancellationToken);
    }

    public async Task<IEnumerable<Malla>> GetMallasWithRelationsForConfiguracionAsync(int idCiclo, CancellationToken cancellationToken)
    {
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.DetalleMalla)
            .Include(m => m.MallaRequisitos)
            .Include(m => m.MallaParalelo)
            .Include(m => m.EspecieCiclo)
            .Where(m => m.IdCiclo == idCiclo)
            .ToListAsync(cancellationToken);
    }
}
