using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Commands;

/// <summary>
/// Crea de forma atómica: PeriodoLectivo → Regimen → Ciclo → Malla → MallaRequisitos
/// → DetalleMalla (por cada materia) → EspecieCiclo (2 especies)
/// y opcionalmente: MallaParalelo + Distributivos.
/// </summary>
public record CrearMallaCompletaCommand(CrearMallaCompletaRequest Request) : IRequest<CrearMallaCompletaResultDTO>;
