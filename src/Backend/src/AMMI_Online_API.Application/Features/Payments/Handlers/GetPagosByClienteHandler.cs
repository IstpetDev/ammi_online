using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class GetPagosByClienteHandler : IRequestHandler<GetPagosByClienteQuery, IEnumerable<PagoDTO>>
{
    private readonly IPagoRepository _pagoRepository;

    public GetPagosByClienteHandler(IPagoRepository pagoRepository)
    {
        _pagoRepository = pagoRepository;
    }

    public async Task<IEnumerable<PagoDTO>> Handle(GetPagosByClienteQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _pagoRepository.GetByClienteDocumentoAsync(request.Documento, cancellationToken);
        return pagos.Select(p => MapToDto(p)).ToList();
    }

    private PagoDTO MapToDto(Pago pago)
    {
        var primeraCuota = pago.PagoCuota.FirstOrDefault();
        var idMatricula = primeraCuota?.IdDetalleCreditoNavigation?.IdCreditoNavigation?.IdMatricula ?? 0;

        return new PagoDTO
        {
            IdPago = pago.IdPago,
            IdTipoPago = pago.IdTipoPago,
            TipoPagoDetalle = pago.IdTipoPagoNavigation?.Detalle ?? string.Empty,
            IdCliente = pago.IdCliente,
            ClienteDocumento = pago.IdClienteNavigation?.Documento ?? string.Empty,
            ClienteNombre = $"{pago.IdClienteNavigation?.Nombres} {pago.IdClienteNavigation?.Apellidos}".Trim(),
            IdEstadoPago = pago.IdEstadoPago,
            EstadoPagoDetalle = pago.IdEstadoPagoNavigation?.Detalle ?? string.Empty,
            EsCancelado = pago.IdEstadoPagoNavigation?.EsCancelado ?? false,
            FechaPago = pago.FechaPago,
            ValorPago = pago.ValorPago,
            FechaDeposito = pago.FechaDeposito,
            IdCuentaBancaria = pago.IdCuentaBancaria,
            NumeroDeposito = pago.NumeroDeposito ?? string.Empty,
            FechaRegistro = pago.FechaRegistro,
            UrlComprobante = pago.UrlComprobante,
            FechaEliminacion = pago.FechaEliminacion,
            Observaciones = pago.Observaciones ?? string.Empty,
            UsuarioRegistro = pago.UsuarioRegistro,
            UsuarioElimino = pago.UsuarioElimino,
            IdMatricula = idMatricula,
            CuotasAplicadas = pago.PagoCuota.Select(pc => new PagoCuotaInfoDTO
            {
                IdPagoCuota = pc.IdPagoCuota,
                IdDetalleCredito = pc.IdDetalleCredito,
                NumeroCuota = pc.IdDetalleCreditoNavigation?.NumeroCuota ?? 0,
                ValorAplicado = pc.ValorAplicado,
                SaldoCuota = pc.IdDetalleCreditoNavigation?.SaldoCuota ?? 0,
                EstadoCuota = pc.IdDetalleCreditoNavigation?.Estado ?? string.Empty,
                IdCredito = pc.IdDetalleCreditoNavigation?.IdCredito ?? 0,
                DetalleEspecie = pc.IdDetalleCreditoNavigation?.IdCreditoNavigation?.IdEspecieCicloNavigation?.IdEspecieNavigation?.Detalle ?? string.Empty
            }).ToList()
        };
    }
}