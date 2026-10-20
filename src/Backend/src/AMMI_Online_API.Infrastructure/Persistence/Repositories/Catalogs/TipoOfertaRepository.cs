using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoOfertaRepository : ITipoOfertaRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoOfertaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoOferta?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoOferta
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTipoOferta == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoOferta>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoOferta
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoOferta> AddAsync(TipoOferta tipoOferta, CancellationToken cancellationToken)
    {
        await _context.TipoOferta.AddAsync(tipoOferta, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoOferta;
    }

    public async Task<TipoOferta> UpdateAsync(TipoOferta tipoOferta, CancellationToken cancellationToken)
    {
        _context.TipoOferta.Update(tipoOferta);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoOferta;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.TipoOferta.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.TipoOferta.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoOferta
            .AnyAsync(t => t.IdTipoOferta == id, cancellationToken);
    }
}
