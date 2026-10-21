using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Queries;

public record GetPostulacionesQuery(
    int? IdTipoEstadoAprobacion = null,
    int? IdMalla = null,
    int? IdCiclo = null,
    int PageNumber = 1,
    int PageSize = 10,
    bool ExcludeContactoPersona = false,
    string? Search = null
) : IRequest<Response<PaginatedResult<PostulacionDTO>>>;
