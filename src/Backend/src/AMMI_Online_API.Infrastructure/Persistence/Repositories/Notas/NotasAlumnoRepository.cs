using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Notas;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Notas;

public class NotasAlumnoRepository : INotasAlumnoRepository
{
    private readonly Ammi_OnlineContext _context;

    public NotasAlumnoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<NotasAlumno?> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _context.NotasAlumno
            .Include(n => n.IdPlantillaEstructuraNavigation)
            .Include(n => n.IdDetaleMatriculaNavigation)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dml => dml.IdMateriaNavigation)
            .FirstOrDefaultAsync(n => n.IdNotasAlumno == id, ct);
    }

    public async Task<NotasAlumno?> GetNotaAsync(int idPlantillaEstructura, int idMatricula, CancellationToken ct)
    {
        // Must traverse navigation to find by matricula
        return await _context.NotasAlumno
            .Include(n => n.IdDetaleMatriculaNavigation)
            .FirstOrDefaultAsync(n => n.IdPlantillaEstructura == idPlantillaEstructura 
                                   && n.IdDetaleMatriculaNavigation.IdMatricula == idMatricula, ct);
    }

    public async Task<IEnumerable<NotasAlumno>> GetByMatriculaAsync(int idMatricula, CancellationToken ct)
    {
        return await _context.NotasAlumno
            .Include(n => n.IdPlantillaEstructuraNavigation)
            .Include(n => n.IdDetaleMatriculaNavigation)
            .Where(n => n.IdDetaleMatriculaNavigation.IdMatricula == idMatricula)
            .ToListAsync(ct);
    }

    // NUEVO
    public async Task<IEnumerable<NotasAlumno>> GetByDetalleMatriculaAsync(int idDetalleMatricula, CancellationToken ct)
    {
        return await _context.NotasAlumno
            .Include(n => n.IdPlantillaEstructuraNavigation)
            .Include(n => n.IdDetaleMatriculaNavigation)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dml => dml.IdMateriaNavigation)
            .Where(n => n.IdDetaleMatricula == idDetalleMatricula)
            .ToListAsync(ct);
    }

    // NUEVO
    public async Task<IEnumerable<NotasAlumno>> GetByMatriculaYMateriaAsync(int idMatricula, int idDetalleMalla, CancellationToken ct)
    {
         return await _context.NotasAlumno
            .Include(n => n.IdPlantillaEstructuraNavigation)
            .Include(n => n.IdDetaleMatriculaNavigation)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dml => dml.IdMateriaNavigation)
            .Where(n => n.IdDetaleMatriculaNavigation.IdMatricula == idMatricula 
                     && n.IdDetaleMatriculaNavigation.IdDetalleMalla == idDetalleMalla)
            .ToListAsync(ct);
    }

    public async Task<bool> ExisteNotaAsync(int idDetalleMatricula, int idPlantillaEstructura, CancellationToken ct)
    {
        return await _context.NotasAlumno
            .AnyAsync(n => n.IdDetaleMatricula == idDetalleMatricula 
                        && n.IdPlantillaEstructura == idPlantillaEstructura, ct);
    }

    public async Task<NotasAlumno?> GetNotaByDetalleMatriculaAsync(int idPlantillaEstructura, int idDetalleMatricula, CancellationToken ct)
    {
        return await _context.NotasAlumno
            .FirstOrDefaultAsync(n => n.IdPlantillaEstructura == idPlantillaEstructura && n.IdDetaleMatricula == idDetalleMatricula, ct);
    }

    public async Task<IEnumerable<NotasAlumno>> GetByMatriculaAndPlantillaAsync(int idMatricula, int idPlantillaEvaluacion, CancellationToken ct)
    {
        return await _context.NotasAlumno
            .Include(n => n.IdPlantillaEstructuraNavigation)
            .Include(n => n.IdDetaleMatriculaNavigation)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dml => dml.IdMateriaNavigation)
            .Where(n => n.IdDetaleMatriculaNavigation.IdMatricula == idMatricula
                     && n.IdPlantillaEstructuraNavigation.IdPlantillaEvaluacion == idPlantillaEvaluacion)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<NotasAlumno>> GetByPlantillaEstructuraAsync(int idPlantillaEstructura, CancellationToken ct)
    {
        return await _context.NotasAlumno
            .Where(n => n.IdPlantillaEstructura == idPlantillaEstructura)
            .ToListAsync(ct);
    }

    public async Task<NotasAlumno> AddAsync(NotasAlumno entity, CancellationToken ct)
    {
        await _context.NotasAlumno.AddAsync(entity, ct);
        await _context.SaveChangesAsync(ct);
        return entity;
    }

    public async Task AddRangeAsync(IEnumerable<NotasAlumno> entities, CancellationToken ct)
    {
        await _context.NotasAlumno.AddRangeAsync(entities, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(NotasAlumno entity, CancellationToken ct)
    {
        _context.NotasAlumno.Update(entity);
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var entity = await _context.NotasAlumno.FindAsync(new object[] { id }, ct);
        if (entity != null)
        {
            _context.NotasAlumno.Remove(entity);
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken ct)
    {
        return await _context.NotasAlumno.AnyAsync(n => n.IdNotasAlumno == id, ct);
    }

    public async Task UpsertAsync(int idPlantillaEstructura, int idDetalleMatricula, decimal valor, string? observacion, CancellationToken ct)
    {
        var entity = await _context.NotasAlumno
            .FirstOrDefaultAsync(n => n.IdPlantillaEstructura == idPlantillaEstructura && n.IdDetaleMatricula == idDetalleMatricula, ct);

        if (entity == null)
        {
            entity = new NotasAlumno
            {
                IdPlantillaEstructura = idPlantillaEstructura,
                IdDetaleMatricula = idDetalleMatricula,
                ValorNota = valor,
                Observacion = observacion
            };
            await _context.NotasAlumno.AddAsync(entity, ct);
        }
        else
        {
            entity.ValorNota = valor;
            entity.Observacion = observacion ?? entity.Observacion;
            _context.NotasAlumno.Update(entity);
        }
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<NotasAlumno>> GetByMallaParaleloAndEstructuraAsync(int idMallaParalelo, int idPlantillaEstructura, CancellationToken ct)
    {
        return await _context.NotasAlumno
            .Include(n => n.IdDetaleMatriculaNavigation)
                .ThenInclude(dm => dm.IdMatriculaNavigation)
                    .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                        .ThenInclude(u => u.IdPersonaNavigation)
            .Where(n => n.IdPlantillaEstructura == idPlantillaEstructura 
                     && n.IdDetaleMatriculaNavigation.IdMatriculaNavigation.IdMallaParalelo == idMallaParalelo)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<NotasAlumno>> GetByMallaParaleloAndDetalleMallaAsync(int idMallaParalelo, int idDetalleMalla, CancellationToken ct)
    {
        return await _context.NotasAlumno
            .Include(n => n.IdDetaleMatriculaNavigation)
                .ThenInclude(dm => dm.IdMatriculaNavigation)
                    .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                        .ThenInclude(u => u.IdPersonaNavigation)
            .Include(n => n.IdPlantillaEstructuraNavigation)
            .Where(n => n.IdDetaleMatriculaNavigation.IdMatriculaNavigation.IdMallaParalelo == idMallaParalelo
                     && n.IdDetaleMatriculaNavigation.IdDetalleMalla == idDetalleMalla)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<NotasAlumno>> GetByParaleloAsync(int idMallaParalelo, int? idDetalleMatricula, int? idDetalleMalla, int? idMatricula, CancellationToken ct)
    {
        var idsDetalle = await (
            from dm in _context.DetalleMatricula
            join m in _context.Matricula on dm.IdMatricula equals m.IdMatricula
            where m.IdMallaParalelo == idMallaParalelo
                && (!idMatricula.HasValue      || dm.IdMatricula       == idMatricula.Value)
                && (!idDetalleMalla.HasValue   || dm.IdDetalleMalla    == idDetalleMalla.Value)
                && (!idDetalleMatricula.HasValue || dm.IdDetalleMatricula == idDetalleMatricula.Value)
            select dm.IdDetalleMatricula
        ).ToListAsync(ct);

        if (!idsDetalle.Any())
            return Enumerable.Empty<NotasAlumno>();

        return await _context.NotasAlumno
            .Include(n => n.IdPlantillaEstructuraNavigation)
            .Include(n => n.IdDetaleMatriculaNavigation)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dml => dml.IdMateriaNavigation)
            .Where(n => idsDetalle.Contains(n.IdDetaleMatricula))
            .ToListAsync(ct);
    }
}
