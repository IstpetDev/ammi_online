using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using MediatR;

namespace AMMI_Online_API.Application.Features.Payments.Handlers;

public class GetCreditosByMatriculaHandler
    : IRequestHandler<GetCreditosByMatriculaQuery, Response<IEnumerable<CreditoDTO>>>
{
    private readonly ICreditoRepository _repository;

    public GetCreditosByMatriculaHandler(ICreditoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<CreditoDTO>>> Handle(
        GetCreditosByMatriculaQuery request,
        CancellationToken cancellationToken)
    {
        var creditos = await _repository.GetCreditosByMatriculaAsync(
            request.IdMatricula,
            cancellationToken);

        var creditosDTO = creditos.Select(c => new CreditoDTO
        {
            IdCredito = c.IdCredito,
            IdMatricula = c.IdMatricula,
            IdEspecieCiclo = c.IdEspecieCiclo,
            MontoOriginal = c.MontoOriginal,
            MontoBeneficio = c.MontoBeneficio,
            MontoFinal = c.MontoFinal,
            SaldoPendiente = c.SaldoPendiente,
            Estado = c.Estado ?? string.Empty,
            FechaGeneracion = c.FechaGeneracion,
            ValorEspecie = c.IdEspecieCicloNavigation?.ValorEspecie ?? 0,
            IdEspecie = c.IdEspecieCicloNavigation?.IdEspecie ?? 0,
            DetalleEspecie = c.IdEspecieCicloNavigation?.IdEspecieNavigation?.Detalle ?? string.Empty,
            EsDiferible = c.IdEspecieCicloNavigation?.IdEspecieNavigation?.EsDiferible ?? false,
            DetallesCredito = c.DetalleCredito.Select(dc => new DetalleCreditoItemDTO
            {
                IdDetalleCredito = dc.IdDetalleCredito,
                NumeroCuota = dc.NumeroCuota,
                Valor = dc.ValorOriginal,
                ValorCancelado = dc.ValorOriginal - dc.SaldoCuota,
                ValorOriginal = dc.ValorOriginal,
                SaldoCuota = dc.SaldoCuota,
                FechaLimite = dc.FechaLimite,
                Estado = dc.Estado ?? string.Empty,
                Pagado = dc.Pagado
            }).ToList()
        }).ToList();

        return new Response<IEnumerable<CreditoDTO>>(creditosDTO);
    }

    public class DiferirCreditoHandler
        : IRequestHandler<DiferirCreditoCommand, Response<DiferirCreditoResultDTO>>
    {
        private readonly ICreditoRepository _repository;

        public DiferirCreditoHandler(ICreditoRepository repository)
        {
            _repository = repository;
        }

        public async Task<Response<DiferirCreditoResultDTO>> Handle(
            DiferirCreditoCommand request,
            CancellationToken cancellationToken)
        {
            // 1. Validar número de cuotas
            if (request.NumeroCuotas < 1 || request.NumeroCuotas > 12)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El número de cuotas debe estar entre 1 y 12.");
            }

            // 2. Obtener el crédito con sus relaciones necesarias
            var credito = await _repository.GetCreditoByIdAsync(
                request.IdCredito,
                cancellationToken);

            if (credito == null)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El crédito no existe.");
            }

            // 3. Validar que la especie sea diferible
            if (credito.IdEspecieCicloNavigation?.IdEspecieNavigation?.EsDiferible != true)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "Este crédito no es diferible. Solo se pueden diferir créditos con especies diferibles.");
            }

            // 4. Validar estado: PENDIENTE_DIFERIR (primera vez) o ACTIVO (re-diferimiento)
            if (credito.Estado != "ACTIVO" && credito.Estado != "PENDIENTE_DIFERIR")
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El crédito no está en un estado válido para diferir. Estado actual: " + credito.Estado);
            }

            // 5. Si ya tiene cuotas: si está ACTIVO se eliminan las pendientes (re-diferimiento);
            //    si está PENDIENTE_DIFERIR con cuotas existentes se rechaza
            if (credito.DetalleCredito.Any())
            {
                if (credito.Estado == "ACTIVO")
                {
                    await _repository.EliminarDetallesPendientesAsync(credito.IdCredito, cancellationToken);
                }
                else
                {
                    return Response<DiferirCreditoResultDTO>.Failure(
                        "Este crédito ya tiene cuotas generadas. No se puede diferir nuevamente.");
                }
            }

            // 6. Calcular monto a diferir
            // ACTIVO: usa SaldoPendiente (re-diferimiento); PENDIENTE_DIFERIR: usa MontoFinal ?? MontoOriginal
            var montoADiferir = credito.Estado == "ACTIVO"
                ? credito.SaldoPendiente
                : (credito.MontoFinal ?? credito.MontoOriginal);

            if (montoADiferir <= 0)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El monto a diferir es 0, no hay monto que diferir.");
            }

            // 7. Obtener datos del ciclo
            var ciclo = credito.IdEspecieCicloNavigation?.IdCicloNavigation;

            if (ciclo?.FechaInicioEstimada == null || ciclo?.FechaFinEstimada == null)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El ciclo no tiene fechas de inicio y fin definidas.");
            }

            // 8. Determinar próximo número de cuota (para re-diferimiento conserva las ya pagadas)
            var cuotasPagadas = credito.DetalleCredito.Where(dc => dc.Pagado).ToList();
            int proximoNumeroCuota = cuotasPagadas.Any()
                ? cuotasPagadas.Max(dc => dc.NumeroCuota) + 1
                : 1;

            // 9. Calcular valor por cuota
            var valorPorCuota = Math.Round(montoADiferir / request.NumeroCuotas, 2);
            var valorUltimaCuota = montoADiferir - (valorPorCuota * (request.NumeroCuotas - 1));

            // 10. Calcular fechas límite
            var fechaInicio = ciclo.FechaInicioEstimada.Value;
            var fechaFin = ciclo.FechaFinEstimada.Value;
            var diasTotales = fechaFin.DayNumber - fechaInicio.DayNumber;
            var intervalo = request.NumeroCuotas > 1 ? diasTotales / request.NumeroCuotas : 0;

            // 11. Crear detalles de crédito
            var detallesCredito = new List<DetalleCredito>();
            var cuotasGeneradas = new List<CuotaGeneradaDTO>();

            for (int i = 1; i <= request.NumeroCuotas; i++)
            {
                var esUltimaCuota = i == request.NumeroCuotas;
                var valorCuota = esUltimaCuota ? valorUltimaCuota : valorPorCuota;
                var fechaLimite = esUltimaCuota
                    ? fechaFin
                    : fechaInicio.AddDays(intervalo * i);

                var numeroCuotaActual = proximoNumeroCuota + i - 1;

                var detalle = new DetalleCredito
                {
                    IdCredito = credito.IdCredito,
                    NumeroCuota = numeroCuotaActual,
                    ValorOriginal = valorCuota,
                    SaldoCuota = valorCuota,
                    FechaLimite = fechaLimite,
                    Estado = "PENDIENTE",
                    Pagado = false
                };

                detallesCredito.Add(detalle);

                cuotasGeneradas.Add(new CuotaGeneradaDTO
                {
                    Numero = numeroCuotaActual,
                    Valor = valorCuota,
                    FechaLimite = fechaLimite
                });
            }

            // 12. Guardar nuevas cuotas
            await _repository.CrearDetallesCreditoAsync(detallesCredito, cancellationToken);

            // 13. Actualizar el crédito
            credito.Estado = "ACTIVO";
            credito.SaldoPendiente = montoADiferir;
            credito.UpdatedAt = DateTime.Now;
            await _repository.UpdateCreditoAsync(credito, cancellationToken);

            // 14. Retornar resultado
            var resultado = new DiferirCreditoResultDTO
            {
                IdCredito = credito.IdCredito,
                NumeroCuotas = request.NumeroCuotas,
                ValorPorCuota = valorPorCuota,
                DetallesGenerados = cuotasGeneradas
            };

            return Response<DiferirCreditoResultDTO>.Success(
                resultado,
                $"Crédito diferido exitosamente en {request.NumeroCuotas} cuotas.");
        }
    }
}
