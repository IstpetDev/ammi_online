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
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.DetalleMalla)
            .Include(m => m.IdTipoOfertaNavigation)
            .OrderByDescending(m => m.IdCicloNavigation.EsActivo)
            .ThenBy(m => m.IdCursosNavigation.Orden)
            .ThenBy(m => m.IdMalla)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Malla>> GetAllPagedAsync(int? idMalla, string? detalle, int? idCursos, int? idTipoOferta, int? idCiclo, int pageNumber, int pageSize, CancellationToken cancellationToken)
    {
        IQueryable<Malla> query = _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.DetalleMalla)
            .Include(m => m.IdTipoOfertaNavigation);

        if (idMalla.HasValue)
            query = query.Where(m => m.IdMalla == idMalla.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(m => m.Detalle.Contains(detalle));
        if (idCursos.HasValue)
            query = query.Where(m => m.IdCursos == idCursos.Value);
        if (idTipoOferta.HasValue)
            query = query.Where(m => m.IdTipoOferta == idTipoOferta.Value);
        if (idCiclo.HasValue)
            query = query.Where(m => m.IdCiclo == idCiclo.Value);

        return await query
            .OrderByDescending(m => m.IdCicloNavigation.EsActivo)
            .ThenBy(m => m.IdCursosNavigation.Orden)
            .ThenBy(m => m.IdMalla)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAllAsync(int? idMalla, string? detalle, int? idCursos, int? idTipoOferta, int? idCiclo, CancellationToken cancellationToken)
    {
        IQueryable<Malla> query = _context.Malla.AsNoTracking();

        if (idMalla.HasValue)
            query = query.Where(m => m.IdMalla == idMalla.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(m => m.Detalle.Contains(detalle));
        if (idCursos.HasValue)
            query = query.Where(m => m.IdCursos == idCursos.Value);
        if (idTipoOferta.HasValue)
            query = query.Where(m => m.IdTipoOferta == idTipoOferta.Value);
        if (idCiclo.HasValue)
            query = query.Where(m => m.IdCiclo == idCiclo.Value);

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
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.IdTipoOfertaNavigation)
            .Include(m => m.DetalleMalla)
            .Where(m => m.IdTipoOferta == idTipoOferta)
            .Where(m => m.IdCicloNavigation != null && m.IdCicloNavigation.EsActivo)
            .OrderBy(m => m.IdCursosNavigation.Orden)
            .ThenBy(m => m.IdMalla)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Malla>> GetByCicloIdAsync(int idCiclo, CancellationToken cancellationToken)
    {
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCicloNavigation)
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.DetalleMalla)
            .Include(m => m.IdTipoOfertaNavigation)
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
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.IdTipoOfertaNavigation)
            .FirstOrDefaultAsync(m => m.IdMalla == idMalla, cancellationToken);
    }
}
