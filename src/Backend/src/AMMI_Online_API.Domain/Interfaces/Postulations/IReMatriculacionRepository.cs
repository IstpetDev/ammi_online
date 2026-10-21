using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Postulations;

/// <summary>
/// Consultas especializadas para el proceso de re-matriculación.
/// </summary>
public interface IReMatriculacionRepository
{
    /// <summary>
    /// Devuelve la última matrícula del alumno (activa o con estado Completado),
    /// incluyendo DetalleMatricula, MallaParalelo → Malla → Ciclo → TipoOferta → Cursos.
    /// </summary>
    Task<Matricula?> GetUltimaMatriculaConDetallesAsync(int idPersona, CancellationToken ct);

    /// <summary>
    /// Busca una malla para repetir: mismo IdCursos en el ciclo destino.
    /// </summary>
    Task<Malla?> GetMallaParaRepetirAsync(int idCursos, int idCicloDestino, CancellationToken ct);

    /// <summary>
    /// Busca la malla del siguiente nivel: Cursos con Orden = ordenActual + 1
    /// en el ciclo destino (sin filtrar por especialidad, el Orden es global).
    /// </summary>
    Task<Malla?> GetMallaParaSiguienteNivelAsync(
        int ordenSiguiente, int idCicloDestino, CancellationToken ct);

    /// <summary>
    /// Devuelve los MallaParalelo activos de la malla con cupo disponible.
    /// Incluye conteo de matriculados actuales para calcular el cupo restante.
    /// </summary>
    Task<IEnumerable<(MallaParalelo Paralelo, int Matriculados)>> GetParalelosConCupoAsync(
        int idMalla, CancellationToken ct);

    /// <summary>
    /// Verifica si el alumno ya tiene una matrícula activa (no completada) en la malla indicada.
    /// </summary>
    Task<bool> AlumnoYaMatriculadoEnMallaAsync(int idPersona, int idMalla, CancellationToken ct);

    /// <summary>
    /// Verifica si el alumno tiene deudas/saldos pendientes asociados a alguna de sus matrículas.
    /// </summary>
    Task<bool> TieneDeudasPendientesAsync(int idPersona, CancellationToken ct);
}
