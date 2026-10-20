using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoActividadEconomicaCommand(string Nombre, bool EsFormal) : IRequest<Response<int>>;
public record UpdateTipoActividadEconomicaCommand(int IdtipoActividadEconomica, string Nombre, bool EsFormal) : IRequest<Response<bool>>;
public record DeleteTipoActividadEconomicaCommand(int IdtipoActividadEconomica) : IRequest<Response<bool>>;
