using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class GetSaldoFavorHandler : IRequestHandler<GetSaldoFavorQuery, Response<SaldoFavorDTO>>
{
    private readonly ISaldoFavorRepository _repository;

    public GetSaldoFavorHandler(ISaldoFavorRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<SaldoFavorDTO>> Handle(GetSaldoFavorQuery request, CancellationToken cancellationToken)
    {
        var saldoFavor = await _repository.GetOrCreateByPersonaAsync(request.IdPersona, cancellationToken);
        var movimientos = await _repository.GetMovimientosAsync(request.IdPersona, 20, cancellationToken);

        var dto = new SaldoFavorDTO
        {
            IdPersona = saldoFavor.IdPersona,
            Saldo = saldoFavor.Saldo ?? 0,
            UltimosMovimientos = movimientos.Select(m => new SaldoFavorMovimientoDTO
            {
                IdMovimiento = m.IdMovimiento,
                Monto = m.Monto ?? 0,
                Concepto = m.Concepto ?? string.Empty,
                IdCredito = m.IdCredito,
                IdDetalleCredito = m.IdDetalleCredito,
                FechaMovimiento = m.FechaMovimiento
            }).ToList()
        };

        return Response<SaldoFavorDTO>.Success(dto, "Saldo recuperado correctamente");
    }
}

public class AplicarSaldoFavorHandler : IRequestHandler<AplicarSaldoFavorCommand, Response<SaldoFavorDTO>>
{
    private readonly ISaldoFavorRepository _repository;

    public AplicarSaldoFavorHandler(ISaldoFavorRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<SaldoFavorDTO>> Handle(AplicarSaldoFavorCommand request, CancellationToken cancellationToken)
    {
        if (request.Monto <= 0)
        {
            return Response<SaldoFavorDTO>.Failure("El monto a aplicar debe ser mayor a 0");
        }

        try
        {
            await _repository.AplicarSaldoAsync(request.IdPersona, request.IdDetalleCredito, request.Monto, cancellationToken);
            
            var saldoFavor = await _repository.GetOrCreateByPersonaAsync(request.IdPersona, cancellationToken);
            var movimientos = await _repository.GetMovimientosAsync(request.IdPersona, 20, cancellationToken);

            var dto = new SaldoFavorDTO
            {
                IdPersona = saldoFavor.IdPersona,
                Saldo = saldoFavor.Saldo ?? 0,
                UltimosMovimientos = movimientos.Select(m => new SaldoFavorMovimientoDTO
                {
                    IdMovimiento = m.IdMovimiento,
                    Monto = m.Monto ?? 0,
                    Concepto = m.Concepto ?? string.Empty,
                    IdCredito = m.IdCredito,
                    IdDetalleCredito = m.IdDetalleCredito,
                    FechaMovimiento = m.FechaMovimiento
                }).ToList()
            };

            return Response<SaldoFavorDTO>.Success(dto, "Saldo aplicado correctamente");
        }
        catch (Exception ex)
        {
            return Response<SaldoFavorDTO>.Failure(ex.Message);
        }
    }
}
