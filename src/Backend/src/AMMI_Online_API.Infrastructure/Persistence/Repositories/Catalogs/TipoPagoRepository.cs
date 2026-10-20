using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoPagoRepository : ITipoPagoRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoPagoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoPago?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoPago
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTipoPago == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoPago>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoPago
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoPago> AddAsync(TipoPago tipoPago, CancellationToken cancellationToken)
    {
        await _context.TipoPago.AddAsync(tipoPago, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoPago;
    }

    public async Task<TipoPago> UpdateAsync(TipoPago tipoPago, CancellationToken cancellationToken)
    {
        _context.TipoPago.Update(tipoPago);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoPago;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.TipoPago.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.TipoPago.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoPago
            .AnyAsync(t => t.IdTipoPago == id, cancellationToken);
    }
}
