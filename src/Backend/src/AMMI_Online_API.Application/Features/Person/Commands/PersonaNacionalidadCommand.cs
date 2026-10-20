using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public record CreatePersonaNacionalidadCommand(int IdPersona, int IdPais, string Nacio) : IRequest<Response<int>>;
public record UpdatePersonaNacionalidadCommand(int IdPersonaNacionalidad, int IdPersona, int IdPais, string Nacio) : IRequest<Response<bool>>;
public record DeletePersonaNacionalidadCommand(int IdPersonaNacionalidad) : IRequest<Response<bool>>;

