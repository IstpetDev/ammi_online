using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetByPersonaActividadEconomicaAsync
    (
    int? IdPersonaActividadEconomica,
    int? IdPersona,
    int? IdTipoActividadEconomica,
    decimal? Valor,
    bool? EsPrincipal,
    bool? Activo
    ) : IRequest<Response<IEnumerable<PersonaActividadEconomicaDTO>>>;

