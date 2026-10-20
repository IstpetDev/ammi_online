using AMMI_Online_API.Domain.Entities;


namespace AMMI_Online_API.Domain.Interfaces.Postulations;

public interface IMatriculaRepository
{
    Task<IEnumerable<Matricula>> GetAllMatriculasWithDetailsAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Matricula>> GetAllMatriculasWithPersonaDetailsAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Matricula>> GetAllMatriculasPagedAsync(int pageNumber, int pageSize, CancellationToken cancellationToken);
    Task<int> CountAllMatriculasAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Matricula>> GetByMallaPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken ct);
    Task<int> CountByMallaAsync(int idMalla, CancellationToken ct);
    Task<Matricula?> GetByIdAsync(int id, CancellationToken ct);
    Task<Matricula?> GetByIdWithDetailsAsync(int id, CancellationToken ct);
    Task<IEnumerable<Matricula>> GetByParaleloAsync(int idParalelo, CancellationToken ct);
    Task<IEnumerable<Matricula>> GetByAlumnoAsync(int idUsuarioAlumno, CancellationToken ct);
    Task<IEnumerable<Matricula>> GetByAlumnoWithDetailsAsync(int idUsuarioAlumno, CancellationToken ct);
    Task<IEnumerable<Matricula>> GetByMallaAsync(int idMalla, CancellationToken ct);
    Task<Matricula?> GetByAlumnoAndCicloAsync(int idUsuarioAlumno, int idCiclo, CancellationToken ct);

    // NUEVO: Consultas para notas por materia
    Task<DetalleMatricula?> GetDetalleMatriculaByIdAsync(int idDetalleMatricula, CancellationToken ct);
    Task<DetalleMatricula?> GetDetalleMatriculaByMatriculaYMateriaAsync(int idMatricula, int idDetalleMalla, CancellationToken ct);
    Task<IEnumerable<DetalleMatricula>> GetDetallesMatriculaByParaleloYMateriaAsync(int idParalelo, int idDetalleMalla, CancellationToken ct);
    Task ActualizarResultadoDetalleMatriculaAsync(int idDetalleMatricula, decimal notaFinal, bool aprobado, CancellationToken ct);
    Task ActualizarExamenRemedialAsync(int idDetalleMatricula, decimal examenRemedial, CancellationToken ct);
    Task<Matricula?> GetByIdForBoletinAsync(int idMatricula, CancellationToken ct);
}
