using AMMI_Online_API.Application.DTOs.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Queries;

/// <summary>
/// Devuelve el diagnóstico de re-matriculación para un alumno dado un ciclo destino:
/// resultado académico, malla destino sugerida y paralelos disponibles.
/// </summary>
public record GetReMatriculaInfoQuery(string NumeroDocumento, int IdCicloDestino)
    : IRequest<ReMatriculaInfoDTO>;
