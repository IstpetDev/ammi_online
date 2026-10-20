using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetByPersonaAlergiasAsync 
    (
    int? IdPersonaAlergias,
    int? IdPersona,
    string? Detalle,
    int? IdTipoAlergia
    ) : IRequest<Response<IEnumerable<PersonaAlergiasDTO>>>;

