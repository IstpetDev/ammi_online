using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Commands;

public record CreateOperacionCommand(string Detalle) : IRequest<Response<int>>;
public record UpdateOperacionCommand(int IdOperacion, string Detalle) : IRequest<Response<bool>>;
public record DeleteOperacionCommand(int IdOperacion) : IRequest<Response<bool>>;
