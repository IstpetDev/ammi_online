using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class EstadoPagoRepository : IEstadoPagoRepository
{
    private readonly Ammi_OnlineContext _context;

    public EstadoPagoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }
    public async Task<IEnumerable<EstadoPago>> GetAllAsync(
        int? idEstadoPago,
        string? detalle,
        bool? esCancelado,
        CancellationToken cancellationToken)
    {
        var query = _context.EstadoPago.AsQueryable();
        if(idEstadoPago.HasValue)
            query = query.Where(x => x.IdEstadoPago == idEstadoPago.Value);
        if(!string.IsNullOrEmpty(detalle))
            query = query.Where(x => x.Detalle.Contains(detalle));
        if(esCancelado.HasValue)
            query = query.Where(x => x.EsCancelado == esCancelado.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<EstadoPago?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.EstadoPago
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdEstadoPago == id, cancellationToken);
    }

    public async Task<EstadoPago> AddAsync(EstadoPago estadoPago, CancellationToken cancellationToken)
    {
        await _context.EstadoPago.AddAsync(estadoPago, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return estadoPago;
    }

    public async Task<EstadoPago> UpdateAsync(EstadoPago estadoPago, CancellationToken cancellationToken)
    {
        _context.EstadoPago.Update(estadoPago);
        await _context.SaveChangesAsync(cancellationToken);
        return estadoPago;
    }
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.EstadoPago.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
            return false;
        _context.EstadoPago.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.EstadoPago
            .AnyAsync(e => e.IdEstadoPago == id, cancellationToken);
    }

}
