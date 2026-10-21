using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Commands;

/// <summary>
/// Duplica la estructura de una malla (DetalleMalla + MallaRequisitos) apuntando a un ciclo destino.
/// Validaciones:
///   - El ciclo destino debe existir y tener EsActivo = true.
///   - No debe existir ya una malla con el mismo IdCursos + IdTipoOferta en el ciclo destino.
/// </summary>
public record DuplicarMallaCommand(DuplicarMallaRequest Request) : IRequest<DuplicarMallaResultDTO>;
