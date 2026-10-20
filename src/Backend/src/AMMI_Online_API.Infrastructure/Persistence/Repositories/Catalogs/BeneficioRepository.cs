using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class  BeneficioRepository : IBeneficioRepository
{
    private readonly Ammi_OnlineContext _context;

    public BeneficioRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Beneficio?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Beneficio.AsNoTracking()
            .FirstOrDefaultAsync(b => b.IdBeneficio == id, cancellationToken);
    }

    public async Task<Beneficio?> GetByIdEspecieAsync(int idEspecie, CancellationToken cancellationToken)
    {
        return await _context.Beneficio.AsNoTracking()
            .FirstOrDefaultAsync(b => b.AplicaA == idEspecie, cancellationToken);
    }
    public async Task<IEnumerable<Beneficio>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Beneficio.AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Beneficio> AddAsync(Beneficio beneficio, CancellationToken cancellationToken)
    {
        await _context.Beneficio.AddAsync(beneficio, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return beneficio;
    }
    public async Task<Beneficio> UpdateAsync(Beneficio beneficio, CancellationToken cancellationToken)
    {
        _context.Beneficio.Update(beneficio);
        await _context.SaveChangesAsync(cancellationToken);
        return beneficio;
    }
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.Beneficio.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
            return false;
        entity.Activo = false;
        _context.Beneficio.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Beneficio
            .AnyAsync(b => b.IdBeneficio == id, cancellationToken);
    }
}
