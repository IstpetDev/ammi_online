using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Commands;

public record CreatePagoCommand : IRequest<Response<int>>
{
    public CreatePagoDTO Pago { get; init; }
    public bool DistribuirExcedente { get; init; } = true;
}

public record ValidatePagoCommand : IRequest<Response<int>>
{
    public int IdPago { get; set; }
    public List<PagoCuotaItem>? Cuotas { get; set; } // null indica que se distribuirá automáticamente
    public bool DistribuirExcedente { get; set; } = true;
}