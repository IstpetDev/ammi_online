using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Commands;

/// <summary>
/// Ejecuta la re-matriculación completa de un alumno:
/// valida el estado académico, determina la malla destino,
/// cierra la matrícula anterior si aplica y genera la nueva matrícula.
/// </summary>
public record ReMatricularCommand(
    int IdPersona,
    int IdCicloDestino,
    int IdMallaParalelo,

    /// <summary>
    /// Si true, cierra automáticamente la matrícula anterior del alumno
    /// antes de crear la nueva. Requiere que exista un estado de matrícula
    /// con Completado = true configurado en el sistema.
    /// </summary>
    bool CerrarMatriculaAnterior = true,

    /// <summary>ID del EstadoMatricula con Completado=true para cerrar la matrícula anterior.</summary>
    int? IdEstadoMatriculaCompletado = null
) : IRequest<Response<ReMatricularResultDTO>>;
