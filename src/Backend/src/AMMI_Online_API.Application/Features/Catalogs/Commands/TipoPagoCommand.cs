using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Catalogs.Commands;

public record CreateTipoPagoCommand(string Detalle) : IRequest<Response<int>>;
public record UpdateTipoPagoCommand(int IdTipoPago, string Detalle) : IRequest<Response<bool>>;
public record DeleteTipoPagoCommand(int IdTipoPago) : IRequest<Response<bool>>;
