using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using MediatR;

namespace AMMI_Online_API.Application.Features.Infrastructure.Queries;

public record GetDetalleMallaByIdQuery(int Id) : IRequest<DetalleMallaDTO>;
public record GetDetalleMallaByMallaIdQuery(int IdMalla, int PageNumber = 1, int PageSize = 10) : IRequest<PaginatedResult<DetalleMallaDTO>>;
