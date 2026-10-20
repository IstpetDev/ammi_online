using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Commands;

public record CreateRolUsuarioCommand(RolUsuarioCreateDTO RolUsuario) : IRequest<Response<int>>;
public record UpdateRolUsuarioCommand(RolUsuarioUpdateDTO RolUsuario) : IRequest<Response<bool>>;
public record DeleteRolUsuarioCommand(int IdRolUsuario) : IRequest<Response<bool>>;
