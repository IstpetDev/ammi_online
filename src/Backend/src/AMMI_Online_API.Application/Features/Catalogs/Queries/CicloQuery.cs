using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Queries;

public record GetCicloQuery(
    int? IdCiclo,
    int? IdPadre,
    int? IdPeriodo,
    int? IdRegimen,
    string? Detalle,
    DateOnly? FechaInicioEstimada,
    DateOnly? FechaFinEstimada,
    bool? EsActivo
    ) : IRequest<Response<IEnumerable<CicloDTO>>>;