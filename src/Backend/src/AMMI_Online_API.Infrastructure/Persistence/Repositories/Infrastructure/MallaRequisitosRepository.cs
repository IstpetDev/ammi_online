using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Infrastructure;

public class MallaRequisitosRepository : IMallaRequisitosRepository
{
    private readonly Ammi_OnlineContext _context;

    public MallaRequisitosRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<MallaRequisitos?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.MallaRequisitos
            .Include(mr => mr.IdMallaNavigation)
            .Include(mr => mr.IdRequisitosNavigation)
            .FirstOrDefaultAsync(mr => mr.IdMallaRequisitos == id, cancellationToken);
    }

    public async Task<IEnumerable<MallaRequisitos>> GetByMallaIdAsync(int idMalla, CancellationToken cancellationToken)
    {
        return await _context.MallaRequisitos
            .Where(mr => mr.IdMalla == idMalla)
            .Include(mr => mr.IdMallaNavigation)
            .Include(mr => mr.IdRequisitosNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<MallaRequisitos>> GetByRequisitoIdAsync(int idRequisito, CancellationToken cancellationToken)
    {
        return await _context.MallaRequisitos
            .Where(mr => mr.IdRequisitos == idRequisito)
            .Include(mr => mr.IdMallaNavigation)
            .Include(mr => mr.IdRequisitosNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<MallaRequisitos> AddAsync(MallaRequisitos mallaRequisitos, CancellationToken cancellationToken)
    {
        _context.MallaRequisitos.Add(mallaRequisitos);
        await _context.SaveChangesAsync(cancellationToken);
        return mallaRequisitos;
    }

    public async Task<IEnumerable<MallaRequisitos>> AddRangeAsync(IEnumerable<MallaRequisitos> mallaRequisitos, CancellationToken cancellationToken)
    {
        var list = mallaRequisitos.ToList();
        _context.MallaRequisitos.AddRange(list);
        await _context.SaveChangesAsync(cancellationToken);
        return list;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.MallaRequisitos.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null) return false;

        _context.MallaRequisitos.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteByMallaIdAsync(int idMalla, CancellationToken cancellationToken)
    {
        var entities = await _context.MallaRequisitos
            .Where(mr => mr.IdMalla == idMalla)
            .ToListAsync(cancellationToken);

        if (!entities.Any()) return false;

        _context.MallaRequisitos.RemoveRange(entities);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int idMalla, int idRequisito, CancellationToken cancellationToken)
    {
        return await _context.MallaRequisitos
            .AnyAsync(mr => mr.IdMalla == idMalla && mr.IdRequisitos == idRequisito, cancellationToken);
    }

    public async Task<IEnumerable<MallaRequisitos>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.MallaRequisitos
            .Include(mr => mr.IdMallaNavigation)
            .Include(mr => mr.IdRequisitosNavigation)
            .ToListAsync(cancellationToken);
    }
}
