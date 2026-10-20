using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;
using Org.BouncyCastle.Crypto;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;
public class GetPagosPendientesQueryHandler : IRequestHandler<GetPagosPendientesQuery, Response<IEnumerable<PagoDTO>>>
{
    private readonly IPagoRepository _pagoRepository;

    public GetPagosPendientesQueryHandler(IPagoRepository pagoRepository)
    {
        _pagoRepository = pagoRepository;
    }

    public async Task<Response<IEnumerable<PagoDTO>>> Handle(GetPagosPendientesQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _pagoRepository.GetPagosPendientesAsync(
            request.IdMatricula,
            request.Documento,
            cancellationToken);

        var pagosDto = pagos.Select(p => new PagoDTO
        {
            IdPago = p.IdPago,
            IdTipoPago = p.IdTipoPago,
            TipoPagoDetalle = p.IdTipoPagoNavigation?.Detalle,
            FechaPago = p.FechaPago,
            ValorPago = p.ValorPago,
            FechaDeposito = p.FechaDeposito,
            IdCuentaBancaria = p.IdCuentaBancaria,
            NumeroDeposito = p.NumeroDeposito,
            RucCliente = p.RucCliente,
            Observaciones = p.Observaciones,
            FechaRegistro = p.FechaRegistro,
            EsValidado = p.EsValidado,
            IdMatricula = request.IdMatricula ?? 0,
            CuotasAplicadas = new List<PagoCuotaInfoDTO>() // Asignar una lista vacía o mapear según corresponda
        }).ToList();

        return Response<IEnumerable<PagoDTO>>.Success(pagosDto, "Pagos pendientes obtenidos correctamente");
    }
}
