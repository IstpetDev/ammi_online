using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class ActualizarFechaLimiteCuotaHandler : IRequestHandler<ActualizarFechaLimiteCuotaCommand, Response<bool>>
{
    private readonly ICreditoRepository _repository;

    public ActualizarFechaLimiteCuotaHandler(ICreditoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<bool>> Handle(ActualizarFechaLimiteCuotaCommand request, CancellationToken cancellationToken)
    {
        var cuota = await _repository.GetDetalleCreditoByIdAsync(request.IdDetalleCredito, cancellationToken);

        if (cuota == null)
            return Response<bool>.Failure("La cuota no existe.");

        var estadoUpper = cuota.Estado?.ToUpper();
        if (estadoUpper == "PAGADO" || estadoUpper == "PAGADA")
            return Response<bool>.Failure("No se puede editar la fecha de una cuota completamente pagada.");

        var hoy = DateOnly.FromDateTime(DateTime.Today);
        if (request.Request.NuevaFechaLimite < hoy)
            return Response<bool>.Failure("La nueva fecha no puede ser anterior a la fecha de hoy.");

        var todasCuotas = await _repository.GetDetallesByCreditoAsync(cuota.IdCredito, cancellationToken);
        var siguienteCuota = todasCuotas
            .FirstOrDefault(c => c.NumeroCuota == cuota.NumeroCuota + 1);

        if (siguienteCuota?.FechaLimite != null && request.Request.NuevaFechaLimite >= siguienteCuota.FechaLimite)
            return Response<bool>.Failure(
                $"La fecha no puede ser igual o posterior a la fecha límite de la cuota {siguienteCuota.NumeroCuota} ({siguienteCuota.FechaLimite:dd/MM/yyyy}).");

        await _repository.ActualizarFechaLimiteCuotaAsync(request.IdDetalleCredito, request.Request.NuevaFechaLimite, cancellationToken);

        return Response<bool>.Success(true, "Fecha límite actualizada correctamente.");
    }
}
