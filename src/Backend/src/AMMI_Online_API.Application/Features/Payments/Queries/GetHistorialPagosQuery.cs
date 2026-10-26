using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Queries;

public record GetHistorialPagosQuery : IRequest<Response<PaginatedResult<PagoHistorialDTO>>>
{
    public string? Documento { get; init; }
    public int? IdMatricula { get; init; }
    public DateOnly? FechaDesde { get; init; }
    public DateOnly? FechaHasta { get; init; }
    public bool? EsValidado { get; init; }
    public string? EstadoPago { get; init; }
    public int? Limite { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}
