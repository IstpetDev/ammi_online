using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class GetPagosByDocumentoHandler : IRequestHandler<GetPagosByDocumentoQuery, IEnumerable<PagoDTO>>
{
    private readonly IPagoRepository _repository;

    public GetPagosByDocumentoHandler(IPagoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<PagoDTO>> Handle(GetPagosByDocumentoQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _repository.GetByDocumentoPersonaAsync(request.Documento, cancellationToken);

        return pagos.Select(p => MapToDto(p)).ToList();
    }

    private PagoDTO MapToDto(Pago pago)
    {
        // Mismo mapeo que en el handler anterior
        var primeraCuota = pago.PagoCuota.FirstOrDefault();
        var matriculaId = primeraCuota?.IdDetalleCreditoNavigation?.IdCreditoNavigation?.IdMatricula ?? 0;

        return new PagoDTO
        {
            IdPago = pago.IdPago,
            IdTipoPago = pago.IdTipoPago,
            TipoPagoDetalle = pago.IdTipoPagoNavigation?.Detalle ?? string.Empty,
            FechaPago = pago.FechaPago,
            ValorPago = pago.ValorPago,
            FechaDeposito = pago.FechaDeposito,
            IdCuentaBancaria = pago.IdCuentaBancaria,
            NumeroDeposito = pago.NumeroDeposito ?? string.Empty,
            RucCliente = pago.RucCliente ?? string.Empty,
            Observaciones = pago.Observaciones ?? string.Empty,
            FechaRegistro = pago.FechaRegistro,
            EsValidado = pago.EsValidado,
            IdMatricula = matriculaId,
            CuotasAplicadas = pago.PagoCuota.Select(pc => new PagoCuotaInfoDTO
            {
                IdPagoCuota = pc.IdPagoCuota,
                IdDetalleCredito = pc.IdDetalleCredito,
                NumeroCuota = pc.IdDetalleCreditoNavigation?.NumeroCuota ?? 0,
                ValorAplicado = pc.ValorAplicado,
                SaldoCuota = pc.IdDetalleCreditoNavigation?.SaldoCuota ?? 0,
                EstadoCuota = pc.IdDetalleCreditoNavigation?.Estado ?? string.Empty,
                IdCredito = pc.IdDetalleCreditoNavigation?.IdCredito ?? 0,
                DetalleEspecie = pc.IdDetalleCreditoNavigation?.IdCreditoNavigation?
                                     .IdEspecieCicloNavigation?.IdEspecieNavigation?.Detalle ?? string.Empty
            }).ToList()
        };
    }
}