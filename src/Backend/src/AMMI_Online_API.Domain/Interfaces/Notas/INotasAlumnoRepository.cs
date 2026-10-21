using AMMI_Online_API.Domain.Entities;
using System;

namespace AMMI_Online_API.Domain.Interfaces.Notas;

public interface INotasAlumnoRepository
{
    Task<NotasAlumno?> GetByIdAsync(int id, CancellationToken ct);
    Task<NotasAlumno?> GetNotaAsync(int idPlantillaEstructura, int idMatricula, CancellationToken ct);
    
    [Obsolete("Usar GetByDetalleMatriculaAsync")]
    Task<IEnumerable<NotasAlumno>> GetByMatriculaAsync(int idMatricula, CancellationToken ct);

    // NUEVO: Por DetalleMatricula
    Task<IEnumerable<NotasAlumno>> GetByDetalleMatriculaAsync(int idDetalleMatricula, CancellationToken ct);

    // NUEVO: Por Matricula + DetalleMalla (para el frontend)
    Task<IEnumerable<NotasAlumno>> GetByMatriculaYMateriaAsync(int idMatricula, int idDetalleMalla, CancellationToken ct);

    Task<IEnumerable<NotasAlumno>> GetByMatriculaAndPlantillaAsync(int idMatricula, int idPlantillaEvaluacion, CancellationToken ct);
    Task<IEnumerable<NotasAlumno>> GetByPlantillaEstructuraAsync(int idPlantillaEstructura, CancellationToken ct);
    Task<NotasAlumno> AddAsync(NotasAlumno entity, CancellationToken ct);
    Task AddRangeAsync(IEnumerable<NotasAlumno> entities, CancellationToken ct);
    Task UpdateAsync(NotasAlumno entity, CancellationToken ct);
    Task DeleteAsync(int id, CancellationToken ct);
    Task<bool> ExistsAsync(int id, CancellationToken ct);
    Task UpsertAsync(int idPlantillaEstructura, int idDetalleMatricula, decimal valor, string? observacion, CancellationToken ct);
    
    // Validaciones
    Task<bool> ExisteNotaAsync(int idDetalleMatricula, int idPlantillaEstructura, CancellationToken ct);
    Task<NotasAlumno?> GetNotaByDetalleMatriculaAsync(int idPlantillaEstructura, int idDetalleMatricula, CancellationToken ct);
    
    // Consultas por MallaParalelo
    Task<IEnumerable<NotasAlumno>> GetByMallaParaleloAndEstructuraAsync(int idMallaParalelo, int idPlantillaEstructura, CancellationToken ct);
    Task<IEnumerable<NotasAlumno>> GetByMallaParaleloAndDetalleMallaAsync(int idMallaParalelo, int idDetalleMalla, CancellationToken ct);
    Task<IEnumerable<NotasAlumno>> GetByParaleloAsync(int idMallaParalelo, int? idDetalleMatricula, int? idDetalleMalla, int? idMatricula, CancellationToken ct);
}
