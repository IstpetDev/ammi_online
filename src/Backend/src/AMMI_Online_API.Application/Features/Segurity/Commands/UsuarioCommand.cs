using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Commands;

public record CreateUsuarioCommand(int IdPersona, string Username, string Contrasenia) : IRequest<Response<int>>;
public record UpdateUsuarioCommand(int IdPersona, string Username, string Contrasenia) : IRequest<Response<bool>>;
public record DeleteUsuarioCommand(int IdPersona) : IRequest<Response<bool>>;

