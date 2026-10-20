using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class CursoRepository : ICurso
{
    private readonly Ammi_OnlineContext _context;

    public CursoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Cursos>> FindAsync(
        int? idCursos,
        int? idEspecialidad,
        string? detalle,
        CancellationToken cancellationToken)
    {
        var query = _context.Cursos.AsNoTracking().AsQueryable();

        if (idCursos.HasValue)
            query = query.Where(c => c.IdCursos == idCursos.Value);

        if (idEspecialidad.HasValue)
            query = query.Where(c => c.IdEspecialidad == idEspecialidad.Value);

        if (!string.IsNullOrWhiteSpace(detalle))
            query = query.Where(c => c.Detalle.Contains(detalle));

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Cursos?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Cursos
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdCursos == id, cancellationToken);
    }

    public async Task<Cursos> AddAsync(Cursos curso, CancellationToken cancellationToken)
    {
        await _context.Cursos.AddAsync(curso, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return curso;
    }

    public async Task<Cursos> UpdateAsync(Cursos curso, CancellationToken cancellationToken)
    {
        _context.Cursos.Update(curso);
        await _context.SaveChangesAsync(cancellationToken);
        return curso;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var curso = await _context.Cursos.FindAsync(new object[] { id }, cancellationToken);

        if (curso == null)
            return false;

        _context.Cursos.Remove(curso);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Cursos
            .AnyAsync(c => c.IdCursos == id, cancellationToken);
    }
}
