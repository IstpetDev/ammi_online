using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;

public class OperacionRepository : IOperacionRepository
{
    private readonly Ammi_OnlineContext _context;

    public OperacionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Operacion?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Operacion
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.IdOperacion == id, cancellationToken);
    }

    public async Task<IEnumerable<Operacion>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Operacion
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Operacion> AddAsync(Operacion operacion, CancellationToken cancellationToken)
    {
        await _context.Operacion.AddAsync(operacion, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return operacion;
    }

    public async Task<Operacion> UpdateAsync(Operacion operacion, CancellationToken cancellationToken)
    {
        _context.Operacion.Update(operacion);
        await _context.SaveChangesAsync(cancellationToken);
        return operacion;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.Operacion.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.Operacion.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Operacion
            .AnyAsync(o => o.IdOperacion == id, cancellationToken);
    }
}
