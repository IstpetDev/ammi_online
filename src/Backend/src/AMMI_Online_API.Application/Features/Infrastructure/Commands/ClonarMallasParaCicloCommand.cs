using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Commands;

/// <summary>
/// Dado un ciclo origen y un ciclo destino, clona todas sus mallas:
/// Malla + DetalleMalla + MallaRequisitos + EspecieCiclo (copiadas del origen).
/// Opcionalmente clona también los MallaParalelo.
/// </summary>
public record ClonarMallasParaCicloCommand(ClonarMallasParaCicloRequest Request)
    : IRequest<ClonarMallasResultDTO>;
