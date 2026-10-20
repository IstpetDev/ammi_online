using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetAllParroquiaQuery : IRequest<Response<IEnumerable<ParroquiaDTO>>>;
public record GetParroquiasByCantonQuery(int IdCanton) : IRequest<Response<IEnumerable<ParroquiaDTO>>>;
