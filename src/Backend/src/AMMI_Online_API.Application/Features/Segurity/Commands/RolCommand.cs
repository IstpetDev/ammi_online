using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Commands;

public record CreateRolCommand(string Detalle) : IRequest<Response<int>>;
public record UpdateRolCommand(int IdRol, string Detalle) : IRequest<Response<bool>>;
public record DeleteRolCommand(int IdRol) : IRequest<Response<bool>>;
