using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoEstadoAprobacionRepository : ITipoEstadoAprobacionRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoEstadoAprobacionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoEstadoAprobacion?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoEstadoAprobacion
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTipoEstadoAprobacion == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoEstadoAprobacion>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoEstadoAprobacion
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoEstadoAprobacion> AddAsync(TipoEstadoAprobacion tipoEstadoAprobacion, CancellationToken cancellationToken)
    {
        await _context.TipoEstadoAprobacion.AddAsync(tipoEstadoAprobacion, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoEstadoAprobacion;
    }

    public async Task<TipoEstadoAprobacion> UpdateAsync(TipoEstadoAprobacion tipoEstadoAprobacion, CancellationToken cancellationToken)
    {
        _context.TipoEstadoAprobacion.Update(tipoEstadoAprobacion);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoEstadoAprobacion;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.TipoEstadoAprobacion.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.TipoEstadoAprobacion.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoEstadoAprobacion
            .AnyAsync(t => t.IdTipoEstadoAprobacion == id, cancellationToken);
    }
}
