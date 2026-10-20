using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public record CreatePersonaActividadEconomicaCommand (
    int IdPersona,
    int IdTipoActividadEconomica,
    decimal? Valor,
    bool EsPrincipal,
    bool Activo
    ) : IRequest<Response<int>>;
public record UpdatePersonaActividadEconomicaCommand(
    int IdPersonaActividadEconomica,
    int IdPersona,
    int IdTipoActividadEconomica,
    decimal? Valor,
    bool EsPrincipal,
    bool Activo
    ) : IRequest<Response<bool>>;
public record DeletePersonaActividadEconomicaCommand(int IdPersonaActividadEconomica) : IRequest<Response<bool>>;
