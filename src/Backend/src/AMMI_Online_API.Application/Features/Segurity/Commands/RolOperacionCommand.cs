using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Commands;

public record CreateRolOperacionCommand(RolOperacionCreateDTO RolOperacion) : IRequest<Response<int>>;
public record UpdateRolOperacionCommand(RolOperacionUpdateDTO RolOperacion) : IRequest<Response<bool>>;
public record DeleteRolOperacionCommand(int IdRolOperacion) : IRequest<Response<bool>>;
