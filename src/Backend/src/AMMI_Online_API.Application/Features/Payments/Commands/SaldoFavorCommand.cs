using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Commands;

public record AplicarSaldoFavorCommand(
    int IdPersona,
    int IdDetalleCredito,
    decimal Monto
) : IRequest<Response<SaldoFavorDTO>>;
