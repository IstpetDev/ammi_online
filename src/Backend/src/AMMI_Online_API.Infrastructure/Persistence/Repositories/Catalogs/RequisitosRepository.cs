using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class RequisitosRepository : IRequisitosRepository
{
    private readonly Ammi_OnlineContext _context;

    public RequisitosRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Requisitos?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Requisitos
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdRequisitos == id, cancellationToken);
    }

    public async Task<IEnumerable<Requisitos>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Requisitos
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Requisitos>> GetByMallaAsync(int idMalla, CancellationToken cancellationToken)
    {
        var isMallaActive = await _context.Malla
            .AnyAsync(m => m.IdMalla == idMalla && m.IdCicloNavigation.EsActivo, cancellationToken);

        if (!isMallaActive)
        {
            return Enumerable.Empty<Requisitos>();
        }

        return await _context.MallaRequisitos
            .AsNoTracking()
            .Where(e => e.IdMalla == idMalla)
            .Include(e => e.IdRequisitosNavigation)
            .Select(e => e.IdRequisitosNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Requisitos>> GetByTipoOfertaAsync(int idTipoOferta, CancellationToken cancellationToken)
    {
        return await _context.MallaRequisitos
            .AsNoTracking()
            .Where(e => e.IdMallaNavigation.IdCicloNavigation.IdTipoOferta == idTipoOferta)
            .Include(e => e.IdRequisitosNavigation)
            .Select(e => e.IdRequisitosNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Requisitos>> GetByCursoAsync(int idCurso, CancellationToken cancellationToken)
    {
        return await _context.MallaRequisitos
            .AsNoTracking()
            .Where(e => e.IdMallaNavigation.IdCursos == idCurso)
            .Include(e => e.IdRequisitosNavigation)
            .Select(e => e.IdRequisitosNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<Requisitos> AddAsync(Requisitos requisitos, CancellationToken cancellationToken)
    {
        await _context.Requisitos.AddAsync(requisitos, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return requisitos;
    }

    public async Task<Requisitos> UpdateAsync(Requisitos requisitos, CancellationToken cancellationToken)
    {
        _context.Requisitos.Update(requisitos);
        await _context.SaveChangesAsync(cancellationToken);
        return requisitos;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.Requisitos.FindAsync(new object[] { id }, cancellationToken);

        if (entity == null)
            return false;

        _context.Requisitos.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Requisitos
            .AnyAsync(e => e.IdRequisitos == id, cancellationToken);
    }
}
