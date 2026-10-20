using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;



namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Postulations;

public class MatriculaRepository : IMatriculaRepository
{
    private readonly Ammi_OnlineContext _context;

    public MatriculaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Matricula>> GetAllMatriculasWithDetailsAsync(CancellationToken cancellationToken)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdParaleloNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdCicloNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Matricula>> GetAllMatriculasWithPersonaDetailsAsync(CancellationToken cancellationToken)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.DatosContacto)
                        .ThenInclude(dc => dc.IdTipoDatoContactoNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.PersonaDireccion)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.DocumentosPersonales)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.PersonaInfo)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.PersonaNacionalidad)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.PersonaActividadEconomica)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.PersonaDiscapacidad) 
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.PersonaAlergias) 
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<Matricula?> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _context.Matricula.FindAsync(new object[] { id }, ct);
    }

    public async Task<Matricula?> GetByIdWithDetailsAsync(int id, CancellationToken ct)
    {
         return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdParaleloNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
            .FirstOrDefaultAsync(m => m.IdMatricula == id, ct);
    }

    public async Task<IEnumerable<Matricula>> GetByParaleloAsync(int idParalelo, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdParaleloNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdCicloNavigation)
            .Where(m => m.IdParalelo == idParalelo)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Matricula>> GetByAlumnoAsync(int idUsuarioAlumno, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Where(m => m.IdUsuarioAlumno == idUsuarioAlumno)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Matricula>> GetByAlumnoWithDetailsAsync(int idUsuarioAlumno, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdParaleloNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMateriaNavigation)
            .Include(m => m.DetalleMatricula)
                 .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdCicloNavigation)
            .Where(m => m.IdUsuarioAlumno == idUsuarioAlumno)
            .ToListAsync(ct);
    }

    public async Task<Matricula?> GetByAlumnoAndCicloAsync(int idUsuarioAlumno, int idCiclo, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
            .FirstOrDefaultAsync(m => 
                m.IdUsuarioAlumno == idUsuarioAlumno && 
                m.Credito.Any(c => c.IdEspecieCicloNavigation.IdCiclo == idCiclo), ct);
    }

    public async Task<IEnumerable<Matricula>> GetByMallaAsync(int idMalla, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdParaleloNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdCicloNavigation)
            .Where(m => m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation.IdMalla == idMalla))
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Matricula>> GetAllMatriculasPagedAsync(int pageNumber, int pageSize, CancellationToken cancellationToken)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdParaleloNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdCicloNavigation)
            .OrderBy(m => m.IdMatricula)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAllMatriculasAsync(CancellationToken cancellationToken)
    {
        return await _context.Matricula.AsNoTracking().CountAsync(cancellationToken);
    }

    public async Task<IEnumerable<Matricula>> GetByMallaPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdParaleloNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdCicloNavigation)
            .Where(m => m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation.IdMalla == idMalla))
            .OrderBy(m => m.IdMatricula)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<int> CountByMallaAsync(int idMalla, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .CountAsync(m => m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation.IdMalla == idMalla), ct);
    }

    public async Task ActualizarResultadoDetalleMatriculaAsync(int idDetalleMatricula, decimal notaFinal, bool aprobado, CancellationToken ct)
    {
        var entity = await _context.DetalleMatricula.FindAsync(new object[] { idDetalleMatricula }, ct);
        if (entity == null) return;
        entity.NotaFinal = notaFinal;
        entity.Aprobado = aprobado;
        await _context.SaveChangesAsync(ct);
    }

    public async Task ActualizarExamenRemedialAsync(int idDetalleMatricula, decimal examenRemedial, CancellationToken ct)
    {
        var entity = await _context.DetalleMatricula.FindAsync(new object[] { idDetalleMatricula }, ct);
        if (entity == null) return;
        entity.ExamenRemedial = examenRemedial;
        await _context.SaveChangesAsync(ct);
    }

    public async Task<Matricula?> GetByIdForBoletinAsync(int idMatricula, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdParaleloNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMateriaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdPlantillaEvaluacionNavigation)
            .FirstOrDefaultAsync(m => m.IdMatricula == idMatricula, ct);
    }

    // NUEVO IMPLEMENTACIONES
    public async Task<DetalleMatricula?> GetDetalleMatriculaByIdAsync(int idDetalleMatricula, CancellationToken ct)
    {
        return await _context.DetalleMatricula
            .AsNoTracking()
            .Include(dm => dm.IdMatriculaNavigation)
            .Include(dm => dm.IdDetalleMallaNavigation)
            .FirstOrDefaultAsync(dm => dm.IdDetalleMatricula == idDetalleMatricula, ct);
    }

    public async Task<DetalleMatricula?> GetDetalleMatriculaByMatriculaYMateriaAsync(int idMatricula, int idDetalleMalla, CancellationToken ct)
    {
        return await _context.DetalleMatricula
            .AsNoTracking()
            .Include(dm => dm.IdMatriculaNavigation)
            .Include(dm => dm.IdDetalleMallaNavigation)
            .FirstOrDefaultAsync(dm => dm.IdMatricula == idMatricula && dm.IdDetalleMalla == idDetalleMalla, ct);
    }

    public async Task<IEnumerable<DetalleMatricula>> GetDetallesMatriculaByParaleloYMateriaAsync(int idParalelo, int idDetalleMalla, CancellationToken ct)
    {
        return await _context.DetalleMatricula
            .AsNoTracking()
            .Include(dm => dm.IdMatriculaNavigation)
                .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
            .Include(dm => dm.IdDetalleMallaNavigation)
            .Where(dm => dm.IdMatriculaNavigation.IdParalelo == idParalelo && dm.IdDetalleMalla == idDetalleMalla)
            .OrderBy(dm => dm.IdMatriculaNavigation.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido)
            .ThenBy(dm => dm.IdMatriculaNavigation.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre)
            .ToListAsync(ct);
    }
}
