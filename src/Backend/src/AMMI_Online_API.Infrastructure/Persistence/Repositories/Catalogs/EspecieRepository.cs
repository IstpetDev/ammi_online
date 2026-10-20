using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class EspecieRepository : IEspecieRepository
{
    private readonly Ammi_OnlineContext _context;

    public EspecieRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Especie?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Especie
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdEspecie == id, cancellationToken);
    }

    public async Task<IEnumerable<Especie>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Especie
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Especie> AddAsync(Especie especie, CancellationToken cancellationToken)
    {
        await _context.Especie.AddAsync(especie, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return especie;
    }

    public async Task<Especie> UpdateAsync(Especie especie, CancellationToken cancellationToken)
    {
        _context.Especie.Update(especie);
        await _context.SaveChangesAsync(cancellationToken);
        return especie;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.Especie.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;
        entity.Activo = false;
        _context.Especie.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Especie
            .AnyAsync(e => e.IdEspecie == id, cancellationToken);
    }
}
