using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetAllCantonQuery : IRequest<Response<IEnumerable<CantonDTO>>>;
public record GetCantonesByProvinciaQuery(int IdProvincia) : IRequest<Response<IEnumerable<CantonDTO>>>;
