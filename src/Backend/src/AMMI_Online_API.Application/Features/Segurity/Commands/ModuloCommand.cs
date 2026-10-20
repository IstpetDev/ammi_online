using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Commands;

public record CreateModuloCommand(string Detalle) : IRequest<Response<int>>;
public record UpdateModuloCommand(int IdModulo, string Detalle) : IRequest<Response<bool>>;
public record DeleteModuloCommand(int IdModulo) : IRequest<Response<bool>>;
