using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Queries;

public record GetAllRolOperacionQuery() : IRequest<Response<IEnumerable<RolOperacionDTO>>>;
public record GetRolOperacionByRolQuery(int IdRol) : IRequest<Response<IEnumerable<RolOperacionDTO>>>;
public record GetRolOperacionByModuloOperacionQuery(int IdModuloOperacion) : IRequest<Response<IEnumerable<RolOperacionDTO>>>;
public record GetRolOperacionActivosQuery() : IRequest<Response<IEnumerable<RolOperacionDTO>>>;
