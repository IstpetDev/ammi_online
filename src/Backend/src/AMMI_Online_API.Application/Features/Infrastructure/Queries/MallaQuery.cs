using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Queries;

public record GetAllMallasQuery(
    int? IdMalla,
    string? Detalle,
    int? IdCursos,
    int? IdCiclo,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PaginatedResult<MallaDTO>>;
public record GetMallaByIdQuery(int IdMalla) : IRequest<MallaDTO?>;
public record GetMallasByCicloIdQuery(int IdCiclo) : IRequest<IEnumerable<MallaDTO>>;
public record GetMallaByTipoOfertaWithActiveCicloQuery(int IdTipoOferta) : IRequest<IEnumerable<MallaDTO>>;
public record GetConfiguracionCursosQuery(CursoConfigRequestDTO Request) : IRequest<IEnumerable<CursoConfigStatusDTO>>;
