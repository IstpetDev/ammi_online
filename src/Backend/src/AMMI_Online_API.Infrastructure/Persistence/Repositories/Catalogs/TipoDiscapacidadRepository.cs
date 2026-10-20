using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoDiscapacidadRepository : ITipoDiscapacidadRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoDiscapacidadRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoDiscapacidad?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoDiscapacidad
            .AsNoTracking()
            .FirstOrDefaultAsync(td => td.IdTipoDiscapacidad == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoDiscapacidad>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoDiscapacidad
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoDiscapacidad> AddAsync(TipoDiscapacidad tipoDiscapacidad, CancellationToken cancellationToken)
    {
        await _context.TipoDiscapacidad.AddAsync(tipoDiscapacidad, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoDiscapacidad;
    }

    public async Task<TipoDiscapacidad> UpdateAsync(TipoDiscapacidad tipoDiscapacidad, CancellationToken cancellationToken)
    {
        _context.TipoDiscapacidad.Update(tipoDiscapacidad);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoDiscapacidad;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var tipoDiscapacidad = await _context.TipoDiscapacidad.FindAsync(new object[] { id }, cancellationToken);

        if (tipoDiscapacidad == null)
            return false;

        _context.TipoDiscapacidad.Remove(tipoDiscapacidad);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoDiscapacidad
            .AnyAsync(td => td.IdTipoDiscapacidad == id, cancellationToken);
    }
}
