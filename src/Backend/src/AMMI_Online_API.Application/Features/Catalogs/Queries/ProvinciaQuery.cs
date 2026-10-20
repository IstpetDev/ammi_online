using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetAllProvinciaQuery : IRequest<Response<IEnumerable<ProvinciaDTO>>>;
public record GetProvinciasByPaisQuery(int IdPais) : IRequest<Response<IEnumerable<ProvinciaDTO>>>;
