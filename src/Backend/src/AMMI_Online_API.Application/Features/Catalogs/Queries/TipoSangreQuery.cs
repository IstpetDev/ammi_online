using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetAllTipoSangreQuery : IRequest<IEnumerable<TipoSangreDTO>>;

public record GetTipoSangreByIdQuery(int Id) : IRequest<TipoSangreDTO>;
