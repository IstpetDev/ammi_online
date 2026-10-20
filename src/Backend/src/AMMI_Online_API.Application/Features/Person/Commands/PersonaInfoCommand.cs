using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public record CreatePersonaInfoCommand(
    int IdPersona,
    DateOnly FechaNacimiento,
    int IdEstadoCivil,
    int? IdNacionalidadEtnica,
    int? IdTipoSangre
) : IRequest<Response<int>>;
public record UpdatePersonaInfoCommand(
    int IdPersona,
    DateOnly FechaNacimiento,
    int IdEstadoCivil,
    int? IdNacionalidadEtnica,
    int? IdTipoSangre
) : IRequest<Response<bool>>;
public record DeletePersonaInfoCommand(int IdPersona) : IRequest<Response<bool>>;

