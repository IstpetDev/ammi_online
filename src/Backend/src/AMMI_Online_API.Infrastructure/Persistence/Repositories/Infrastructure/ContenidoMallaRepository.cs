using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Infrastructure;

public class ContenidoMallaRepository : IContenidoMallaRepository
{
    private readonly Ammi_OnlineContext _context;

    public ContenidoMallaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<ContenidoMalla?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.ContenidoMalla
            .Include(c => c.IdDetalleMallaNavigation)
                .ThenInclude(dm => dm.IdMateriaNavigation)
            .FirstOrDefaultAsync(c => c.IdContenidoMalla == id, cancellationToken);
    }

    public async Task<IEnumerable<ContenidoMalla>> GetByDetalleMallaIdAsync(int idDetalleMalla, CancellationToken cancellationToken)
    {
        return await _context.ContenidoMalla
            .Where(c => c.IdDetalleMalla == idDetalleMalla && c.EsActivo)
            .Include(c => c.IdDetalleMallaNavigation)
                .ThenInclude(dm => dm.IdMateriaNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<ContenidoMalla> AddAsync(ContenidoMalla entity, CancellationToken cancellationToken)
    {
        _context.ContenidoMalla.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<ContenidoMalla> UpdateAsync(ContenidoMalla entity, CancellationToken cancellationToken)
    {
        _context.Entry(entity).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.ContenidoMalla.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null) return false;

        // Logical delete? or physical? Plan assumes CRUD. Usually "EsActivo" implies logic delete.
        // But Repo interface says Delete.
        // I will implement Physical delete here. If Logic delete needed, Update is used.
        // Wait, DTO has EsActivo. So Physical delete might remove it completely.
        entity.EsActivo = false;
        _context.ContenidoMalla.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
