using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoSangreRepository : ITipoSangreRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoSangreRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TipoSangre>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoSangre
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoSangre?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoSangre
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTipoSangre == id, cancellationToken);
    }

    public async Task<TipoSangre> AddAsync(TipoSangre tipoSangre, CancellationToken cancellationToken)
    {
        await _context.TipoSangre.AddAsync(tipoSangre, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoSangre;
    }

    public async Task<TipoSangre> UpdateAsync(TipoSangre tipoSangre, CancellationToken cancellationToken)
    {
        _context.TipoSangre.Update(tipoSangre);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoSangre;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.TipoSangre.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null) return false;

        _context.TipoSangre.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoSangre.AnyAsync(t => t.IdTipoSangre == id, cancellationToken);
    }
}
