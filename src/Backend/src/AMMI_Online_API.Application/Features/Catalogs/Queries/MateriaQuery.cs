using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetMateriaQuery(
    int? IdMateria,
    string? Detalle,
    decimal? HorasRequeridas,
    DateOnly? FechaCreacion,
    bool? EsActivo,
    int PageNumber = 1,
    int PageSize = 10) : IRequest<Response<PaginatedResult<MateriaDTO>>>;