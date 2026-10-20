using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class MateriaRepository : IMateria
{
    private readonly Ammi_OnlineContext _context;
    public MateriaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Materia>> FindAsync(
        int? idMateria,
        string? detalle,
        decimal? horasRequeridas,
        DateOnly? fechaCreacion,
        bool? esActivo,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        IQueryable<Materia> query = _context.Materia.AsNoTracking();
        if (idMateria.HasValue)
            query = query.Where(m => m.IdMateria == idMateria.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(m => m.Detalle.Contains(detalle));
        if (horasRequeridas.HasValue)
            query = query.Where(m => m.HorasRequeridas == horasRequeridas.Value);
        if (fechaCreacion.HasValue)
            query = query.Where(m => m.FechaCreacion == fechaCreacion.Value);
        if (esActivo.HasValue)
            query = query.Where(m => m.EsActivo == esActivo.Value);
            
        return await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAsync(
        int? idMateria,
        string? detalle,
        decimal? horasRequeridas,
        DateOnly? fechaCreacion,
        bool? esActivo,
        CancellationToken cancellationToken)
    {
        IQueryable<Materia> query = _context.Materia.AsNoTracking();
        if (idMateria.HasValue)
            query = query.Where(m => m.IdMateria == idMateria.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(m => m.Detalle.Contains(detalle));
        if (horasRequeridas.HasValue)
            query = query.Where(m => m.HorasRequeridas == horasRequeridas.Value);
        if (fechaCreacion.HasValue)
            query = query.Where(m => m.FechaCreacion == fechaCreacion.Value);
        if (esActivo.HasValue)
            query = query.Where(m => m.EsActivo == esActivo.Value);
            
        return await query.CountAsync(cancellationToken);
    }

    public async Task<Materia?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Materia
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.IdMateria == id, cancellationToken);
    }

    public async Task<Materia> AddAsync(Materia materia, CancellationToken cancellationToken)
    {
        await _context.Materia.AddAsync(materia, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return materia;
    }

    public async Task<Materia> UpdateAsync(Materia materia, CancellationToken cancellationToken)
    {
        _context.Materia.Update(materia);
        await _context.SaveChangesAsync(cancellationToken);
        return materia;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var materia = await _context.Materia.FindAsync(new object[] { id }, cancellationToken);
        if (materia == null)
            return false;
        _context.Materia.Remove(materia);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Materia.AnyAsync(
            m => m.IdMateria == id, cancellationToken);
    }
}
