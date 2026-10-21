using AMMI_Online_API.Domain.Entities;


namespace AMMI_Online_API.Domain.Interfaces.Postulations;

public interface IMatriculaRepository
{
    Task<IEnumerable<Matricula>> GetAllMatriculasWithDetailsAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Matricula>> GetAllMatriculasWithPersonaDetailsAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Matricula>> GetAllMatriculasPagedAsync(int pageNumber, int pageSize, int? idCiclo, int? idOfertaAcademica, string? documentoNombre, int? idMalla, CancellationToken cancellationToken);
    Task<int> CountAllMatriculasAsync(int? idCiclo, int? idOfertaAcademica, string? documentoNombre, int? idMalla, CancellationToken cancellationToken);
    Task<IEnumerable<Matricula>> GetByMallaPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken ct);
    Task<int> CountByMallaAsync(int idMalla, CancellationToken ct);
    Task<Matricula?> GetByIdAsync(int id, CancellationToken ct);
    Task<Matricula?> GetByIdWithDetailsAsync(int id, CancellationToken ct);
    Task<IEnumerable<Matricula>> GetByMallaParaleloAsync(int idMallaParalelo, CancellationToken ct);
    Task<IEnumerable<Matricula>> GetByAlumnoAsync(int idUsuarioAlumno, CancellationToken ct);
    Task<IEnumerable<Matricula>> GetByAlumnoWithDetailsAsync(int idUsuarioAlumno, CancellationToken ct);
    Task<IEnumerable<Matricula>> GetByMallaAsync(int idMalla, CancellationToken ct);
    Task<Matricula?> GetByAlumnoAndCicloAsync(int idUsuarioAlumno, int idCiclo, CancellationToken ct);
    Task<List<string>> GetFotoRequisitoCodigosAsync(CancellationToken ct);

    // NUEVO: Consultas para notas por materia
    Task<DetalleMatricula?> GetDetalleMatriculaByIdAsync(int idDetalleMatricula, CancellationToken ct);
    Task<DetalleMatricula?> GetDetalleMatriculaByMatriculaYMateriaAsync(int idMatricula, int idDetalleMalla, CancellationToken ct);
    Task<IEnumerable<DetalleMatricula>> GetDetallesMatriculaByMallaParaleloYMateriaAsync(int idMallaParalelo, int idDetalleMalla, CancellationToken ct);
    Task ActualizarResultadoDetalleMatriculaAsync(int idDetalleMatricula, decimal notaFinal, bool aprobado, CancellationToken ct);
    Task ActualizarExamenRemedialAsync(int idDetalleMatricula, decimal examenRemedial, CancellationToken ct);
    Task<Matricula?> GetByIdForBoletinAsync(int idMatricula, CancellationToken ct);
    Task ActualizarEstadoMatriculaAsync(int idMatricula, int idEstadoMatricula, CancellationToken ct);

    /// <summary>Devuelve true si la malla tiene al menos un alumno matriculado.</summary>
    Task<bool> TieneMatriculadosAsync(int idMalla, CancellationToken ct);

    /// <summary>Devuelve true si alguna malla del ciclo tiene al menos un alumno matriculado.</summary>
    Task<bool> TieneMatriculadosPorCicloAsync(int idCiclo, CancellationToken ct);

    /// <summary>
    /// Obtiene resumen de alumnos con saldos para contabilidad, filtrado por ciclo y opcionalmente por curso y documento.
    /// </summary>
    Task<IEnumerable<Matricula>> GetResumenContabilidadAsync(int idCiclo, int? idCurso, string? documento, CancellationToken ct);
}
