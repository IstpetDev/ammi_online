using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetPersonasInfoQuery
    (
    int? IdPersona,
    DateOnly? FechaNacimiento,
    int? IdEstadoCivil,
    int? IdNacionalidadEtnica
    ) : IRequest<Response<IEnumerable<PersonaInfoDTO>>>;

