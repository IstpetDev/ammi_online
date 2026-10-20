using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Queries;

public record GetAllRolUsuarioQuery() : IRequest<Response<IEnumerable<RolUsuarioDTO>>>;
public record GetRolUsuarioByRolQuery(int IdRol) : IRequest<Response<IEnumerable<RolUsuarioDTO>>>;
public record GetRolUsuarioByPersonaQuery(int IdPersona) : IRequest<Response<IEnumerable<RolUsuarioDTO>>>;
