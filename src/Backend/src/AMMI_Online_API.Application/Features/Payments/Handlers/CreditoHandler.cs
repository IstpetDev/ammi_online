using System;
using System.Linq;
using System.Collections.Generic;
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

        var todosDetalles = creditos
            .SelectMany(c => c.DetalleCredito)
            .OrderBy(d => d.IdCreditoNavigation != null ? d.IdCreditoNavigation.FechaGeneracion : null)
            .ThenBy(d => d.FechaLimite)
            .ToList();

        // Obtener los pagos pendientes únicos relacionados a las cuotas de esta matrícula
        var pendingPayments = todosDetalles
            .SelectMany(d => d.PagoCuota)
            .Select(pc => pc.IdPagoNavigation)
            .Where(p => p != null && p.IdEstadoPago == 1 && p.FechaEliminacion == null)
            .GroupBy(p => p.IdPago)
            .Select(g => g.First())
            .OrderBy(p => p.FechaPago)
            .ToList();

        var simSaldos = todosDetalles.ToDictionary(d => d.IdDetalleCredito, d => d.SaldoCuota ?? 0);
        var pendingApplies = todosDetalles.ToDictionary(d => d.IdDetalleCredito, d => 0m);

        foreach (var pago in pendingPayments)
        {
            decimal saldoRestantePago = pago.ValorPago;
            var idsSelected = pago.PagoCuota.Select(pc => pc.IdDetalleCredito).ToHashSet();
            var idsCreditoSelected = todosDetalles
                .Where(d => idsSelected.Contains(d.IdDetalleCredito))
                .Select(d => d.IdCredito)
                .Distinct()
                .ToHashSet();

            // Obtener todas las cuotas de esta matrícula con saldo simulado disponible
            var cuotasConSaldo = todosDetalles
                .Where(d => simSaldos[d.IdDetalleCredito] > 0)
                .OrderBy(d => !idsCreditoSelected.Contains(d.IdCredito)) // Priorizar cuotas de créditos solicitados
                .ThenBy(d => d.FechaLimite)
                .ThenBy(d => d.IdDetalleCredito)
                .ToList();

            foreach (var cuota in cuotasConSaldo)
            {
                if (saldoRestantePago <= 0.001m) break;

                decimal simSaldo = simSaldos[cuota.IdDetalleCredito];
                decimal valorAAsignar = Math.Min(simSaldo, saldoRestantePago);

                simSaldos[cuota.IdDetalleCredito] -= valorAAsignar;
                pendingApplies[cuota.IdDetalleCredito] += valorAAsignar;
                saldoRestantePago -= valorAAsignar;
            }
        }

        var creditosDTO = creditos.Select(c =>
        {
            var especie = c.IdEspecieCicloNavigation?.IdEspecieNavigation;
            var esPension = especie?.EsPension ?? false;
            var esMatricula = especie?.EsMatricula ?? false;

            return new CreditoDTO
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
                DetalleEspecie = especie?.Detalle ?? string.Empty,
                EsDiferible = esPension && !esMatricula,
                EsPension = esPension,
                EsMatricula = esMatricula,
                DetallesCredito = c.DetalleCredito.Select(dc =>
                {
                    var pendingApply = pendingApplies[dc.IdDetalleCredito];
                    var esPendienteAprobacion = pendingApply > 0;

                    return new DetalleCreditoItemDTO
                    {
                        IdDetalleCredito = dc.IdDetalleCredito,
                        NumeroCuota = dc.NumeroCuota,
                        Valor = dc.ValorOriginal,
                        ValorCancelado = esPendienteAprobacion ? pendingApply : (dc.ValorOriginal - dc.SaldoCuota),
                        ValorOriginal = dc.ValorOriginal,
                        SaldoCuota = dc.SaldoCuota,
                        FechaLimite = dc.FechaLimite,
                        Estado = esPendienteAprobacion ? "PENDIENTE_APROBACION" : (dc.Estado ?? string.Empty),
                        Pagado = dc.Pagado
                    };
                }).ToList()
            };
        }).ToList();

        return new Response<IEnumerable<CreditoDTO>>(creditosDTO);
    }

    public class DiferirCreditoHandler : IRequestHandler<DiferirCreditoCommand, Response<DiferirCreditoResultDTO>>
    {
        private readonly ICreditoRepository _repository;
        private readonly ISaldoFavorRepository _saldoFavorRepository;

        public DiferirCreditoHandler(ICreditoRepository repository, ISaldoFavorRepository saldoFavorRepository)
        {
            _repository = repository;
            _saldoFavorRepository = saldoFavorRepository;
        }

        public async Task<Response<DiferirCreditoResultDTO>> Handle(
            DiferirCreditoCommand request,
            CancellationToken cancellationToken)
        {
            // 1. Validar mínimo de cuotas antes de cargar datos
            if (request.NumeroCuotas < 1)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El número de cuotas debe ser al menos 1.");
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

            // 3. Validar que la especie sea de tipo pensión y no matrícula
            var especie = credito.IdEspecieCicloNavigation?.IdEspecieNavigation;
            if (especie?.EsPension != true || especie?.EsMatricula == true)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "Solo se pueden diferir créditos de tipo pensión. Los créditos de matrícula no pueden ser diferidos.");
            }

            // 4. Obtener ciclo y TipoOferta para calcular el máximo de cuotas
            var ciclo = credito.IdEspecieCicloNavigation?.IdMallaNavigation?.IdCicloNavigation;
            var tipoOferta = ciclo?.IdTipoOfertaNavigation;

            if (tipoOferta == null || tipoOferta.Duracion < 2)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El tipo de oferta asociado no tiene una duración válida configurada para permitir diferimiento.");
            }

            int maxCuotas = tipoOferta.Duracion - 1;

            if (request.NumeroCuotas > maxCuotas)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    $"El número de cuotas debe estar entre 1 y {maxCuotas}.");
            }

            // 5. Validar que el crédito esté en estado PENDIENTE_DIFERIR o tenga al menos una cuota en PARCIAL
            bool tieneCuotasParciales = credito.DetalleCredito.Any(dc => dc.Estado == "PARCIAL");
            if (credito.Estado != "PENDIENTE_DIFERIR" && !tieneCuotasParciales)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El crédito no cumple las condiciones para ser re-diferido. " +
                    "Debe estar en estado PENDIENTE_DIFERIR o tener al menos una cuota en estado PARCIAL.");
            }

            // 6. Calcular el monto total a diferir sumando los saldos de las cuotas no pagadas (o usar el saldo pendiente si no hay cuotas aún)
            var montoADiferir = credito.DetalleCredito.Any()
                ? credito.DetalleCredito.Where(d => d.Estado != "PAGADA").Sum(d => d.SaldoCuota ?? 0)
                : credito.SaldoPendiente;

            if (montoADiferir <= 0)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El saldo pendiente del crédito es 0, no hay monto que diferir.");
            }

            // 7. Separar cuotas parciales de cuotas totalmente pendientes
            var cuotasParaActualizar = new List<DetalleCredito>();
            var cuotasPendientesVacias = new List<DetalleCredito>();

            foreach (var detalle in credito.DetalleCredito.Where(d => d.Estado != "PAGADA"))
            {
                decimal montoPagado = (detalle.ValorOriginal ?? 0) - (detalle.SaldoCuota ?? 0);

                if (montoPagado > 0)
                {
                    // CAMINO 1: Si tiene pagos (PARCIAL), se cierra exclusivamente por ese monto pagado.
                    detalle.ValorOriginal = montoPagado;
                    detalle.SaldoCuota = 0;
                    detalle.Pagado = true;
                    detalle.Estado = "PAGADA";
                    cuotasParaActualizar.Add(detalle);
                }
                else
                {
                    // CAMINO 2: Cuotas puramente pendientes (sin abonos), se reciclan para el diferimiento normal.
                    cuotasPendientesVacias.Add(detalle);
                }
            }

            // Ordenamos las que vamos a reutilizar por número para llevar un orden limpio
            cuotasPendientesVacias = cuotasPendientesVacias.OrderBy(c => c.NumeroCuota).ToList();

            // 8. Validar fechas del ciclo
            if (ciclo?.FechaInicioEstimada == null || ciclo?.FechaFinEstimada == null)
            {
                return Response<DiferirCreditoResultDTO>.Failure(
                    "El ciclo no tiene fechas de inicio y fin definidas.");
            }

            // 9. Determinar a partir de qué número de cuota continuar (basado en las que ya se pagaron/cerraron)
            int proximoNumeroCuota = credito.DetalleCredito
                .Where(dc => dc.Estado == "PAGADA")
                .Select(dc => dc.NumeroCuota)
                .DefaultIfEmpty(0)
                .Max() + 1;

            // 10. Calcular valor por cuota basada en el saldo restante
            var valorPorCuota = Math.Round(montoADiferir / request.NumeroCuotas, 2);
            var valorUltimaCuota = montoADiferir - (valorPorCuota * (request.NumeroCuotas - 1));

            // 11. Calcular fechas límite
            var fechaInicio = ciclo.FechaInicioEstimada.Value;
            var fechaFin = ciclo.FechaFinEstimada.Value;
            var diasTotales = fechaFin.DayNumber - fechaInicio.DayNumber;
            var intervalo = request.NumeroCuotas > 1 ? diasTotales / request.NumeroCuotas : 0;

            // 12. Generar/Reutilizar cuotas
            var nuevosDetalles = new List<DetalleCredito>();
            var cuotasGeneradas = new List<CuotaGeneradaDTO>();

            for (int i = 1; i <= request.NumeroCuotas; i++)
            {
                var esUltimaCuota = i == request.NumeroCuotas;
                var valorCuota = esUltimaCuota ? valorUltimaCuota : valorPorCuota;
                var fechaLimite = esUltimaCuota
                    ? fechaFin
                    : fechaInicio.AddDays(intervalo * i);

                var numeroCuotaActual = proximoNumeroCuota + i - 1;

                if (i - 1 < cuotasPendientesVacias.Count)
                {
                    // REUTILIZAR cuota existente (Diferimiento Normal o Reemplazo)
                    var detalleExistente = cuotasPendientesVacias[i - 1];
                    detalleExistente.NumeroCuota = numeroCuotaActual;
                    detalleExistente.ValorOriginal = valorCuota;
                    detalleExistente.SaldoCuota = valorCuota;
                    detalleExistente.FechaLimite = fechaLimite;
                    detalleExistente.Estado = "PENDIENTE";
                    detalleExistente.Pagado = false;
                    
                    cuotasParaActualizar.Add(detalleExistente);
                }
                else
                {
                    // CREAR nueva cuota si se solicitaron más cuotas de las que ya existían
                    var detalleNuevo = new DetalleCredito
                    {
                        IdCredito = credito.IdCredito,
                        NumeroCuota = numeroCuotaActual,
                        ValorOriginal = valorCuota,
                        SaldoCuota = valorCuota,
                        FechaLimite = fechaLimite,
                        Estado = "PENDIENTE",
                        Pagado = false
                    };
                    nuevosDetalles.Add(detalleNuevo);
                }

                cuotasGeneradas.Add(new CuotaGeneradaDTO
                {
                    Numero = numeroCuotaActual,
                    Valor = valorCuota,
                    FechaLimite = fechaLimite
                });
            }

            // Manejar las cuotas pendientes sobrantes (si antes habían 3 pendientes y ahora solo se difirió a 1 cuota)
            for (int i = request.NumeroCuotas; i < cuotasPendientesVacias.Count; i++)
            {
                var cuotaSobrante = cuotasPendientesVacias[i];
                cuotaSobrante.ValorOriginal = 0;
                cuotaSobrante.SaldoCuota = 0;
                cuotaSobrante.Estado = "PAGADA"; // Neutralizada
                cuotasParaActualizar.Add(cuotaSobrante);
            }

            // 13. Guardar cambios en BD
            if (cuotasParaActualizar.Any())
            {
                await _repository.UpdateDetallesCreditoAsync(cuotasParaActualizar, cancellationToken);
            }
            if (nuevosDetalles.Any())
            {
                await _repository.CrearDetallesCreditoAsync(nuevosDetalles, cancellationToken);
            }

            // 14. Actualizar el crédito
            credito.SaldoPendiente = montoADiferir;
            credito.Estado = "ACTIVO";
            credito.UpdatedAt = DateTime.Now;
            await _repository.UpdateCreditoAsync(credito, cancellationToken);

            // 14.5 Aplicar saldo a favor automático si existe
            var idPersona = credito.IdMatriculaNavigation?.IdUsuarioAlumno;
            if (idPersona.HasValue)
            {
                var saldoFavor = await _saldoFavorRepository.GetOrCreateByPersonaAsync(idPersona.Value, cancellationToken);
                if (saldoFavor != null && (saldoFavor.Saldo ?? 0) > 0)
                {
                    // Obtener los detalles del crédito recién creados/actualizados que estén pendientes
                    var detallesCredito = (await _repository.GetDetallesByCreditoAsync(credito.IdCredito, cancellationToken))
                        .Where(dc => !dc.Pagado && dc.Estado != "PAGADA" && dc.Estado != "PAGADO")
                        .OrderBy(dc => dc.NumeroCuota)
                        .ToList();

                    foreach (var dc in detallesCredito)
                    {
                        if ((saldoFavor.Saldo ?? 0) <= 0) break;

                        var montoAAplicar = Math.Min(saldoFavor.Saldo ?? 0, dc.SaldoCuota ?? 0);
                        if (montoAAplicar > 0)
                        {
                            await _saldoFavorRepository.AplicarSaldoAsync(idPersona.Value, dc.IdDetalleCredito, montoAAplicar, cancellationToken);
                        }
                    }

                    // Recargar el crédito para retornar los datos correctos
                    credito = await _repository.GetCreditoByIdAsync(credito.IdCredito, cancellationToken);
                }
            }

            // 15. Retornar resultado
            var resultado = new DiferirCreditoResultDTO
            {
                IdCredito = credito.IdCredito,
                NumeroCuotas = request.NumeroCuotas,
                ValorPorCuota = valorPorCuota,
                DetallesGenerados = cuotasGeneradas
            };

            return Response<DiferirCreditoResultDTO>.Success(
                resultado,
                $"Crédito re-diferido exitosamente en {request.NumeroCuotas} cuotas.");
        }
    }

    public class ActualizarFechaLimiteCuotaHandler
        : IRequestHandler<ActualizarFechaLimiteCuotaCommand, Response<bool>>
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

            if (cuota.Pagado)
                return Response<bool>.Failure("No se puede cambiar la fecha de una cuota que ya ha sido pagada.");

            if (request.Request.NuevaFechaLimite < DateOnly.FromDateTime(DateTime.Today))
                return Response<bool>.Failure("La nueva fecha límite no puede ser anterior a la fecha actual.");

            await _repository.ActualizarFechaLimiteCuotaAsync(request.IdDetalleCredito, request.Request.NuevaFechaLimite, cancellationToken);
            return Response<bool>.Success(true, "Fecha límite actualizada exitosamente.");
        }
    }
}
