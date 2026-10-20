using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class CreatePagoCreditoHandler : IRequestHandler<CreatePagoCommand, Response<int>>
{
    private readonly IPagoCreditoRepository _pagoCreditoRepository;

    public CreatePagoCreditoHandler(IPagoCreditoRepository pagoCreditoRepository)
    {
        _pagoCreditoRepository = pagoCreditoRepository;
    }

    public async Task<Response<int>> Handle(CreatePagoCommand request, CancellationToken cancellationToken)
    {
        var data = request.Pago;

        var pago = new Pago
        {
            IdTipoPago = data.IdTipoPago,
            FechaPago = data.FechaPago,
            ValorPago = data.ValorPago,
            FechaDeposito = data.FechaDeposito,
            IdCuentaBancaria = data.IdCuentaBancaria,
            NumeroDeposito = data.NumeroDeposito,
            RucCliente = data.RucCliente,
            Observaciones = data.Observaciones,
            FechaRegistro = DateTime.Now,
            EsValidado = null
        };

        int idPago;

        if (data.EsValidado == true)
        {
            // Pago validado: distribución inmediata
            var cuotas = data.Cuotas?.Select(item => new PagoCuota
            {
                IdDetalleCredito = item.IdDetalleCredito,
                ValorAplicado = item.ValorAplicado ?? 0
            }).ToList() ?? new List<PagoCuota>();

            idPago = await _pagoCreditoRepository.CrearPagoConDistribucionAsync(
                pago,
                cuotas,
                request.DistribuirExcedente,
                cancellationToken);
        }
        else
        {
            // Pago no validado: guardar pendiente
            if (data.Cuotas == null || !data.Cuotas.Any())
                throw new Exception("Para pagos no validados debe especificar al menos una cuota.");

            var cuotas = data.Cuotas.Select(item => new PagoCuota
            {
                IdDetalleCredito = item.IdDetalleCredito,
                ValorAplicado = item.ValorAplicado ?? 0
            }).ToList();

            idPago = await _pagoCreditoRepository.CrearPagoPendienteAsync(pago, cuotas, cancellationToken);
        }

        return Response<int>.Success(idPago, "Pago creado correctamente");
    }
}


public class ValidatePagoHandler : IRequestHandler<ValidatePagoCommand, Response<int>>
{
    private readonly IPagoCreditoRepository _pagoCreditoRepository;

    public ValidatePagoHandler(IPagoCreditoRepository pagoCreditoRepository)
    {
        _pagoCreditoRepository = pagoCreditoRepository;
    }

    public async Task<Response<int>> Handle(ValidatePagoCommand request, CancellationToken cancellationToken)
    {
        List<PagoCuota>? cuotas = null;
        if (request.Cuotas != null)
        {
            cuotas = request.Cuotas.Select(item => new PagoCuota
            {
                IdDetalleCredito = item.IdDetalleCredito,
                ValorAplicado = item.ValorAplicado ?? 0
            }).ToList();
        }

        await _pagoCreditoRepository.AplicarDistribucionAPagoAsync(
            request.IdPago,
            cuotas,
            request.DistribuirExcedente,
            cancellationToken);

        return Response<int>.Success(request.IdPago, "Pago validado y distribuido correctamente");
    }
}
