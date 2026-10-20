using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Queries;

public record GetPersonaNacionalidadQuery(
    int? IdPersonaNacionalidad,
    int? IdPersona,
    int? IdPais,
    string? Nacio
) : IRequest<Response<IEnumerable<PersonaNacionalidadDTO>>>;
