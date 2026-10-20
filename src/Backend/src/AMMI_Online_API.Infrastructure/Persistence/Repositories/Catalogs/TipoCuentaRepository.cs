using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoCuentaRepository : ITipoCuentaRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoCuentaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoCuenta?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoCuenta
            .AsNoTracking()
            .FirstOrDefaultAsync(tc => tc.IdTipoCuenta == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoCuenta>> GetTipoCuenta(
        int? IdTipoCuenta,
        string? Detalle,
            CancellationToken cancellationToken)
    {
        var query = _context.TipoCuenta
            .AsNoTracking()
            .AsQueryable();
        if (IdTipoCuenta.HasValue)
            query = query.Where(tc => tc.IdTipoCuenta == IdTipoCuenta.Value);
        if (!string.IsNullOrWhiteSpace(Detalle))
            query = query.Where(tc => tc.Detalle.Contains(Detalle));
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<TipoCuenta> AddSync(TipoCuenta tipoCuenta, CancellationToken cancellationToken)
    {
        await _context.TipoCuenta.AddAsync(tipoCuenta, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoCuenta;
    }

    public async Task<TipoCuenta> UpdateAsync(TipoCuenta tipoCuenta, CancellationToken cancellationToken)
    {
        _context.TipoCuenta.Update(tipoCuenta);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoCuenta;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.TipoCuenta.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
            return false;

        _context.TipoCuenta.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
    public async Task<bool> ExitsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoCuenta
            .AnyAsync(tc => tc.IdTipoCuenta == id, cancellationToken);
    }
}