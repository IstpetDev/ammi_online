using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateCicloCommand(int? IdPadre, int IdPeriodo, int IdRegimen, int IdTipoOferta, string Detalle, DateOnly? FechaInicioEstimada, DateOnly? FechaFinEstimada, bool EsActivo
    ) : IRequest<Response<int>>;
public record UpdateCicloCommand(int IdCiclo, int? IdPadre, int IdPeriodo, int IdRegimen, int IdTipoOferta, string Detalle, DateOnly? FechaInicioEstimada, DateOnly? FechaFinEstimada, bool EsActivo
    ) : IRequest<Response<bool>>;
public record DesactivateCicloCommand(int IdCiclo) : IRequest<Response<bool>>;
public record DeleteCicloCommand(int IdCiclo) : IRequest<Response<bool>>;

