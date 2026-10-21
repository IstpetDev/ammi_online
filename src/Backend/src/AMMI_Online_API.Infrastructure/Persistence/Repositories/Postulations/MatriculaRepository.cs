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
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(m => m.IdEstadoMatriculaNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
            .OrderBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre)
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
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
            .OrderBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre)
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
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(m => m.IdEstadoMatriculaNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
            .FirstOrDefaultAsync(m => m.IdMatricula == id, ct);
    }

    public async Task<IEnumerable<Matricula>> GetByMallaParaleloAsync(int idMallaParalelo, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(m => m.IdEstadoMatriculaNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
            .Where(m => m.IdMallaParalelo == idMallaParalelo)
            .OrderBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre)
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
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(m => m.IdEstadoMatriculaNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMateriaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdAreaCompetenciaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.Distributivo)
                        .ThenInclude(dist => dist.IdPersonaNavigation)
                            .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                 .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
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
                m.Credito.Any(c => c.IdEspecieCicloNavigation.IdMallaNavigation.IdCiclo == idCiclo), ct);
    }

    public async Task<IEnumerable<Matricula>> GetByMallaAsync(int idMalla, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(m => m.IdEstadoMatriculaNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
            .Where(m => m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation.IdMalla == idMalla))
            .OrderBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre)
            .ToListAsync(ct);
    }

    public async Task<int> CountAllMatriculasAsync(int? idCiclo, int? idOfertaAcademica, string? documentoNombre, int? idMalla, CancellationToken cancellationToken)
    {
        var query = _context.Matricula.AsNoTracking();

        if (idCiclo.HasValue)
        {
            query = query.Where(m => m.IdMallaParaleloNavigation.IdMallaNavigation.IdCiclo == idCiclo.Value);
        }

        if (idMalla.HasValue && idMalla.Value > 0)
        {
            query = query.Where(m => m.IdMallaParaleloNavigation.IdMalla == idMalla.Value
                                  || m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation.IdMalla == idMalla.Value));
        }

        if (idOfertaAcademica.HasValue)
        {
            query = query.Where(m => m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation.IdMallaNavigation.IdCicloNavigation.IdTipoOferta == idOfertaAcademica.Value));
        }

        if (!string.IsNullOrWhiteSpace(documentoNombre))
        {
            var term = documentoNombre.Trim().ToLower();
            query = query.Where(m =>
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.Documento != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.Documento.ToLower().Contains(term)) ||
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre.ToLower().Contains(term)) ||
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre.ToLower().Contains(term)) ||
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido.ToLower().Contains(term)) ||
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido.ToLower().Contains(term)) ||
                ((m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre).ToLower().Contains(term)) ||
                ((m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido).ToLower().Contains(term))
            );
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<IEnumerable<Matricula>> GetAllMatriculasPagedAsync(int pageNumber, int pageSize, int? idCiclo, int? idOfertaAcademica, string? documentoNombre, int? idMalla, CancellationToken cancellationToken)
    {
        var query = _context.Matricula.AsNoTracking();

        if (idCiclo.HasValue)
        {
            query = query.Where(m => m.IdMallaParaleloNavigation.IdMallaNavigation.IdCiclo == idCiclo.Value);
        }

        if (idMalla.HasValue && idMalla.Value > 0)
        {
            query = query.Where(m => m.IdMallaParaleloNavigation.IdMalla == idMalla.Value
                                  || m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation.IdMalla == idMalla.Value));
        }

        if (idOfertaAcademica.HasValue)
        {
            query = query.Where(m => m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation.IdMallaNavigation.IdCicloNavigation.IdTipoOferta == idOfertaAcademica.Value));
        }

        if (!string.IsNullOrWhiteSpace(documentoNombre))
        {
            var term = documentoNombre.Trim().ToLower();
            query = query.Where(m =>
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.Documento != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.Documento.ToLower().Contains(term)) ||
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre.ToLower().Contains(term)) ||
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre.ToLower().Contains(term)) ||
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido.ToLower().Contains(term)) ||
                (m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido != null && m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido.ToLower().Contains(term)) ||
                ((m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre).ToLower().Contains(term)) ||
                ((m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido + " " + m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido).ToLower().Contains(term))
            );
        }

        return await query
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(m => m.IdEstadoMatriculaNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.DocumentosPersonales)
                        .ThenInclude(dp => dp.IdAdjuntoNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
            .OrderBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<string>> GetFotoRequisitoCodigosAsync(CancellationToken ct)
    {
        var ids = await _context.Requisitos
            .Where(r => r.EsFoto)
            .Select(r => r.IdRequisitos)
            .ToListAsync(ct);
        return ids.Select(id => id.ToString()).ToList();
    }

    public async Task<IEnumerable<Matricula>> GetByMallaPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken ct)
    {
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(m => m.IdEstadoMatriculaNavigation)
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
                    .ThenInclude(p => p.DocumentosPersonales)
                        .ThenInclude(dp => dp.IdAdjuntoNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.IdDetalleMallaNavigation)
                    .ThenInclude(dmal => dmal.IdMallaNavigation)
                        .ThenInclude(mal => mal.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
            .Where(m => m.DetalleMatricula.Any(dm => dm.IdDetalleMallaNavigation.IdMalla == idMalla))
            .OrderBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre)
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
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdParaleloNavigation)
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

    public async Task ActualizarEstadoMatriculaAsync(int idMatricula, int idEstadoMatricula, CancellationToken ct)
    {
        var matricula = await _context.Matricula.FindAsync(new object[] { idMatricula }, ct);
        if (matricula == null) return;
        matricula.IdEstadoMatricula = idEstadoMatricula;
        await _context.SaveChangesAsync(ct);
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

    public async Task<IEnumerable<DetalleMatricula>> GetDetallesMatriculaByMallaParaleloYMateriaAsync(int idMallaParalelo, int idDetalleMalla, CancellationToken ct)
    {
        return await _context.DetalleMatricula
            .AsNoTracking()
            .Include(dm => dm.IdMatriculaNavigation)
                .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
            .Include(dm => dm.IdDetalleMallaNavigation)
            .Where(dm => dm.IdMatriculaNavigation.IdMallaParalelo == idMallaParalelo && dm.IdDetalleMalla == idDetalleMalla)
            .OrderBy(dm => dm.IdMatriculaNavigation.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido)
            .ThenBy(dm => dm.IdMatriculaNavigation.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre)
            .ToListAsync(ct);
    }

    public async Task<bool> TieneMatriculadosAsync(int idMalla, CancellationToken ct)
    {
        // MallaParalelo → Matricula: si algún paralelo de esta malla tiene al menos 1 matricula
        return await _context.MallaParalelo
            .AsNoTracking()
            .Where(mp => mp.IdMalla == idMalla)
            .SelectMany(mp => mp.Matricula)
            .AnyAsync(ct);
    }

    public async Task<bool> TieneMatriculadosPorCicloAsync(int idCiclo, CancellationToken ct)
    {
        // Malla → MallaParalelo → Matricula: si alguna malla del ciclo tiene al menos 1 matricula
        return await _context.MallaParalelo
            .AsNoTracking()
            .Where(mp => mp.IdMallaNavigation.IdCiclo == idCiclo)
            .SelectMany(mp => mp.Matricula)
            .AnyAsync(ct);
    }

    public async Task<IEnumerable<Matricula>> GetResumenContabilidadAsync(int idCiclo, int? idCurso, string? documento, CancellationToken ct)
    {
        var query = _context.Matricula
            .AsNoTracking()
            .Include(m => m.IdUsuarioAlumnoNavigation)
                .ThenInclude(u => u.IdPersonaNavigation)
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdMallaNavigation)
                    .ThenInclude(m => m.IdCicloNavigation)
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdMallaNavigation)
                    .ThenInclude(m => m.IdCursosNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.DetalleCredito)
                    .ThenInclude(dc => dc.PagoCuota)
                        .ThenInclude(pc => pc.IdPagoNavigation)
                            .ThenInclude(p => p.IdEstadoPagoNavigation)
            .Include(m => m.Credito)
                .ThenInclude(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdEspecieNavigation)
            .Where(m => m.IdMallaParaleloNavigation.IdMallaNavigation.IdCiclo == idCiclo);

        if (idCurso.HasValue)
        {
            query = query.Where(m => m.IdMallaParaleloNavigation.IdMallaNavigation.IdCursos == idCurso.Value);
        }

        if (!string.IsNullOrEmpty(documento))
        {
            query = query.Where(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.Documento == documento);
        }

        return await query
            .OrderBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoApellido)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.PrimerNombre)
            .ThenBy(m => m.IdUsuarioAlumnoNavigation.IdPersonaNavigation.SegundoNombre)
            .ToListAsync(ct);
    }
}
