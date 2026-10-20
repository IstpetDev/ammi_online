using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreatePeriodoLectivoCommand ( string Detalle, DateOnly FechaInicioEstimada, DateOnly FechaFinEstimada
    ) : IRequest<Response<int>>;
public record UpdatePeriodoLectivoCommand (int IdPeriodoLectivo, string Detalle, DateOnly FechaInicioEstimada, DateOnly FechaFinEstimada
    ) : IRequest<Response<bool>>;
public record DeletePeriodoLectivoCommand (int IdPeriodoLectivo) : IRequest<Response<bool>>;