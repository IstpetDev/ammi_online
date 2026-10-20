using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetByPersonaDiscapacidadAsync 
    (
    int? IdPersonaDiscapacidad,
    int? IdPersona,
    int? Porcentaje,
    string? Recomendaciones,
    int? IdTipoDiscapacidad,
    int? IdAdjunto
    ): IRequest<Response<IEnumerable<PersonaDiscapacidadDTO>>>;
