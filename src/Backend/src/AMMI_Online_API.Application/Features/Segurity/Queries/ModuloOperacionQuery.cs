using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Queries;

public record GetAllModuloOperacionQuery() : IRequest<Response<IEnumerable<ModuloOperacionDTO>>>;
public record GetModuloOperacionByModuloQuery(int IdModulo) : IRequest<Response<IEnumerable<ModuloOperacionDTO>>>;
public record GetModuloOperacionByOperacionQuery(int IdOperacion) : IRequest<Response<IEnumerable<ModuloOperacionDTO>>>;
public record GetModuloOperacionActivosQuery() : IRequest<Response<IEnumerable<ModuloOperacionDTO>>>;
