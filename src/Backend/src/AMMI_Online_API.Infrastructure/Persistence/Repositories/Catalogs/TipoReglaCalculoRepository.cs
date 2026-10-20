using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoReglaCalculoRepository : ITipoReglaCalculoRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoReglaCalculoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoReglaCalculo?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoReglaCalculo
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTipoReglaCalculo == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoReglaCalculo>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoReglaCalculo
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoReglaCalculo> AddAsync(TipoReglaCalculo tipoReglaCalculo, CancellationToken cancellationToken)
    {
        await _context.TipoReglaCalculo.AddAsync(tipoReglaCalculo, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoReglaCalculo;
    }

    public async Task<TipoReglaCalculo> UpdateAsync(TipoReglaCalculo tipoReglaCalculo, CancellationToken cancellationToken)
    {
        _context.TipoReglaCalculo.Update(tipoReglaCalculo);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoReglaCalculo;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.TipoReglaCalculo.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.TipoReglaCalculo.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoReglaCalculo
            .AnyAsync(t => t.IdTipoReglaCalculo == id, cancellationToken);
    }
}
