using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class EstadoCivilRepository : IEstadoCivilRepository
{
    private readonly Ammi_OnlineContext _context;

    public EstadoCivilRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<EstadoCivil?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.EstadoCivil
            .AsNoTracking()
            .FirstOrDefaultAsync(ec => ec.IdEstadoCivil == id, cancellationToken);
    }

    public async Task<IEnumerable<EstadoCivil>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.EstadoCivil
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<EstadoCivil> AddAsync(EstadoCivil estadoCivil, CancellationToken cancellationToken)
    {
        await _context.EstadoCivil.AddAsync(estadoCivil, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return estadoCivil;
    }

    public async Task<EstadoCivil> UpdateAsync(EstadoCivil estadoCivil, CancellationToken cancellationToken)
    {
        _context.EstadoCivil.Update(estadoCivil);
        await _context.SaveChangesAsync(cancellationToken);
        return estadoCivil;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var estadoCivil = await _context.EstadoCivil.FindAsync(new object[] { id }, cancellationToken);

        if (estadoCivil == null)
            return false;

        _context.EstadoCivil.Remove(estadoCivil);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.EstadoCivil
            .AnyAsync(ec => ec.IdEstadoCivil == id, cancellationToken);
    }
}
