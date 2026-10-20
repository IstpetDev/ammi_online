

using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class EspecialdiadRepository : IEspecialidad
{
    private readonly Ammi_OnlineContext _context;
    public EspecialdiadRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Especialidad>> FindAsync (
        int? idEspecialidad,
        string? detalle,
        CancellationToken cancellationToken)
    {
        IQueryable<Especialidad> query = _context.Especialidad.AsQueryable();
        if (idEspecialidad.HasValue)
            query = query.Where(e => e.IdEspecialidad == idEspecialidad.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(e => e.Detalle.Contains(detalle));
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Especialidad?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Especialidad
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdEspecialidad == id, cancellationToken);
    }

    public async Task<Especialidad> AddAsync(Especialidad especialidad, CancellationToken cancellationToken)
    {
        await _context.Especialidad.AddAsync(especialidad, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return especialidad;
    }
    public async Task<Especialidad> UpdateAsync(Especialidad especialidad, CancellationToken cancellationToken)
    {
        _context.Especialidad.Update(especialidad);
        await _context.SaveChangesAsync(cancellationToken);
        return especialidad;
    }
    public async Task<Especialidad> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var especialidad = await _context.Especialidad
            .FirstOrDefaultAsync(e => e.IdEspecialidad == id, cancellationToken);
        if (especialidad == null)
            throw new KeyNotFoundException($"Especialidad with ID {id} not found.");
        _context.Especialidad.Remove(especialidad);
        await _context.SaveChangesAsync(cancellationToken);
        return especialidad;
    }
    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Especialidad
            .AnyAsync(e => e.IdEspecialidad == id, cancellationToken);
    }
}
