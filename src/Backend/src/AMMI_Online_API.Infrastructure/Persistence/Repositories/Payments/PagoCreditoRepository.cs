using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class PagoCreditoRepository : IPagoCreditoRepository
{
    private readonly Ammi_OnlineContext _context;

    public PagoCreditoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }


    // Método simple: solo guarda el pago (sin cuotas ni distribución)
    public async Task<int> CrearPagoAsync(Pago pago, CancellationToken cancellationToken)
    {
        _context.Pago.Add(pago);
        await _context.SaveChangesAsync(cancellationToken);
        return pago.IdPago;
    }

    // Crea un pago no validado con sus cuotas asociadas
    public async Task<int> CrearPagoPendienteAsync(Pago pago, List<PagoCuota> cuotas, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Validar que el monto del pago no supere la deuda total de los créditos involucrados
            await ValidarMontoNoExcedeDeuda(pago.ValorPago, cuotas.Select(c => c.IdDetalleCredito).ToList(), cancellationToken);

            // Guardar el pago
            _context.Pago.Add(pago);
            await _context.SaveChangesAsync(cancellationToken);

            // Validar que las cuotas existan
            var idsDetalle = cuotas.Select(c => c.IdDetalleCredito).Distinct().ToList();
            var detalles = await _context.DetalleCredito
                .Where(d => idsDetalle.Contains(d.IdDetalleCredito))
                .ToListAsync(cancellationToken);

            if (detalles.Count != idsDetalle.Count)
            {
                var encontrados = detalles.Select(d => d.IdDetalleCredito).ToList();
                var noEncontrados = idsDetalle.Except(encontrados);
                throw new Exception($"Las siguientes cuotas no existen: {string.Join(", ", noEncontrados)}");
            }

            // Asignar IdPago a cada cuota y guardarlas
            foreach (var cuota in cuotas)
            {
                cuota.IdPago = pago.IdPago;
                _context.PagoCuota.Add(cuota);
            }

            // Cambiar estado de los detalles a PENDIENTE_APROBACION
            foreach (var detalle in detalles)
            {
                detalle.Estado = "PENDIENTE_APROBACION";
                _context.DetalleCredito.Update(detalle);
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return pago.IdPago;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    // Crea un pago validado directamente (distribución inmediata)
    public async Task<int> CrearPagoConDistribucionAsync(
        Pago pago,
        List<PagoCuota> cuotasSolicitud,
        bool distribuirExcedente,
        CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Validar que el monto del pago no supere la deuda total
            await ValidarMontoNoExcedeDeuda(pago.ValorPago, cuotasSolicitud.Select(c => c.IdDetalleCredito).ToList(), cancellationToken);

            // Obtener los créditos involucrados
            var idsDetalle = cuotasSolicitud.Select(c => c.IdDetalleCredito).Distinct().ToList();
            var detallesSolicitados = await _context.DetalleCredito
                .Where(d => idsDetalle.Contains(d.IdDetalleCredito))
                .Include(d => d.IdCreditoNavigation)
                .ThenInclude(c => c.DetalleCredito)
                .ToListAsync(cancellationToken);

            if (detallesSolicitados.Count != idsDetalle.Count)
            {
                var encontrados = detallesSolicitados.Select(d => d.IdDetalleCredito).ToList();
                var noEncontrados = idsDetalle.Except(encontrados);
                throw new Exception($"Las siguientes cuotas no existen: {string.Join(", ", noEncontrados)}");
            }

            var idsCredito = detallesSolicitados.Select(d => d.IdCredito).Distinct().ToList();
            var todosDetalles = await _context.DetalleCredito
                .Where(d => idsCredito.Contains(d.IdCredito))
                .OrderBy(d => d.FechaLimite)
                .ToListAsync(cancellationToken);

            // Asegurar que existan cuotas suficientes para cubrir el saldo pendiente de cada crédito
            await AsegurarCuotasDeCredito(idsCredito, cancellationToken);
            // Recargar detalles actualizados
            todosDetalles = await _context.DetalleCredito
                .Where(d => idsCredito.Contains(d.IdCredito))
                .OrderBy(d => d.FechaLimite)
                .ToListAsync(cancellationToken);

            var cuotasSolicitudItems = cuotasSolicitud.Select(c => new PagoCuotaItem
            {
                IdDetalleCredito = c.IdDetalleCredito,
                ValorAplicado = c.ValorAplicado
            }).ToList();

            var distribucion = CalcularDistribucion(todosDetalles, cuotasSolicitudItems, pago.ValorPago, distribuirExcedente);

            // Guardar el pago
            _context.Pago.Add(pago);
            await _context.SaveChangesAsync(cancellationToken);

            // Registrar PagoCuota y actualizar saldos
            foreach (var item in distribucion)
            {
                var detalle = todosDetalles.First(d => d.IdDetalleCredito == item.IdDetalleCredito);
                detalle.SaldoCuota ??= 0;

                var pagoCuota = new PagoCuota
                {
                    IdPago = pago.IdPago,
                    IdDetalleCredito = item.IdDetalleCredito,
                    ValorAplicado = item.ValorAplicado
                };
                _context.PagoCuota.Add(pagoCuota);

                detalle.SaldoCuota -= item.ValorAplicado;

                if (detalle.SaldoCuota <= 0)
                {
                    detalle.Pagado = true;
                    detalle.Estado = "PAGADA";
                }
                else
                {
                    detalle.Estado = detalle.FechaLimite.HasValue && detalle.FechaLimite < DateOnly.FromDateTime(DateTime.Now) ? "VENCIDA" : "PARCIAL";
                }

                _context.DetalleCredito.Update(detalle);
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return pago.IdPago;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    // Valida un pago existente (pendiente)
    public async Task AplicarDistribucionAPagoAsync(
        int idPago,
        List<PagoCuota>? cuotasSolicitud,
        bool distribuirExcedente,
        CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var pago = await _context.Pago
                .FirstOrDefaultAsync(p => p.IdPago == idPago, cancellationToken);
            if (pago == null)
                throw new Exception($"El pago con ID {idPago} no existe.");
            if (pago.EsValidado == true)
                throw new Exception("El pago ya está validado.");

            // Determinar qué cuotas se usarán para la distribución
            List<PagoCuota> cuotasParaDistribucion;
            if (cuotasSolicitud != null && cuotasSolicitud.Any())
            {
                cuotasParaDistribucion = cuotasSolicitud.Select(c => new PagoCuota
                {
                    IdPago = idPago,
                    IdDetalleCredito = c.IdDetalleCredito,
                    ValorAplicado = c.ValorAplicado
                }).ToList();
            }
            else
            {
                cuotasParaDistribucion = await _context.PagoCuota
                    .Where(pc => pc.IdPago == idPago)
                    .ToListAsync(cancellationToken);
                if (!cuotasParaDistribucion.Any())
                    throw new Exception("El pago no tiene cuotas asociadas para validar.");
            }

            // Obtener los créditos involucrados
            var idsDetalle = cuotasParaDistribucion.Select(c => c.IdDetalleCredito).Distinct().ToList();
            var detalles = await _context.DetalleCredito
                .Include(d => d.IdCreditoNavigation)
                .Where(d => idsDetalle.Contains(d.IdDetalleCredito))
                .ToListAsync(cancellationToken);
            if (detalles.Count != idsDetalle.Count)
            {
                var encontrados = detalles.Select(d => d.IdDetalleCredito).ToList();
                var noEncontrados = idsDetalle.Except(encontrados);
                throw new Exception($"Las siguientes cuotas no existen: {string.Join(", ", noEncontrados)}");
            }

            var idsCredito = detalles.Select(d => d.IdCredito).Distinct().ToList();

            // Asegurar que cada crédito tenga cuotas suficientes para cubrir su SaldoPendiente
            await AsegurarCuotasDeCredito(idsCredito, cancellationToken);

            // Recargar todos los detalles de estos créditos (ahora con las nuevas cuotas)
            var todosDetalles = await _context.DetalleCredito
                .Where(d => idsCredito.Contains(d.IdCredito))
                .OrderBy(d => d.FechaLimite)
                .ToListAsync(cancellationToken);

            // Convertir a PagoCuotaItem y calcular distribución
            var items = cuotasParaDistribucion.Select(c => new PagoCuotaItem
            {
                IdDetalleCredito = c.IdDetalleCredito,
                ValorAplicado = c.ValorAplicado
            }).ToList();

            var distribucion = CalcularDistribucion(todosDetalles, items, pago.ValorPago, distribuirExcedente);

            // Eliminar todas las PagoCuota actuales de este pago
            var cuotasActuales = await _context.PagoCuota
                .Where(pc => pc.IdPago == idPago)
                .ToListAsync(cancellationToken);
            _context.PagoCuota.RemoveRange(cuotasActuales);

            // Crear nuevas PagoCuota con los valores distribuidos
            var nuevasCuotas = distribucion.Select(item => new PagoCuota
            {
                IdPago = idPago,
                IdDetalleCredito = item.IdDetalleCredito,
                ValorAplicado = item.ValorAplicado
            }).ToList();
            _context.PagoCuota.AddRange(nuevasCuotas);

            // Actualizar los detalles de crédito
            foreach (var item in distribucion)
            {
                var detalle = todosDetalles.First(d => d.IdDetalleCredito == item.IdDetalleCredito);
                detalle.SaldoCuota ??= 0;
                detalle.SaldoCuota -= item.ValorAplicado;

                if (detalle.SaldoCuota <= 0)
                {
                    detalle.Pagado = true;
                    detalle.Estado = "PAGADA";
                }
                else
                {
                    detalle.Estado = detalle.FechaLimite.HasValue && detalle.FechaLimite < DateOnly.FromDateTime(DateTime.Now) ? "VENCIDA" : "PARCIAL";
                }
                _context.DetalleCredito.Update(detalle);
            }

            pago.EsValidado = true;
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    // Método auxiliar: asegura que un crédito tenga cuotas (DetalleCredito) suficientes para cubrir su SaldoPendiente
    private async Task AsegurarCuotasDeCredito(List<int> idsCredito, CancellationToken cancellationToken)
    {
        var creditos = await _context.Credito
            .Include(c => c.DetalleCredito)
            .Where(c => idsCredito.Contains(c.IdCredito))
            .ToListAsync(cancellationToken);

        foreach (var credito in creditos)
        {
            var sumaSaldoCuotas = credito.DetalleCredito.Sum(d => d.SaldoCuota ?? 0);
            var saldoPendienteCredito = credito.SaldoPendiente;

            if (sumaSaldoCuotas < saldoPendienteCredito)
            {
                // Crear cuotas faltantes
                var faltante = saldoPendienteCredito - sumaSaldoCuotas;
                var ultimaCuota = credito.DetalleCredito.OrderBy(d => d.NumeroCuota).LastOrDefault();
                var nuevoNumeroCuota = (ultimaCuota?.NumeroCuota ?? 0) + 1;

                var nuevaCuota = new DetalleCredito
                {
                    IdCredito = credito.IdCredito,
                    NumeroCuota = nuevoNumeroCuota,
                    ValorOriginal = faltante,
                    SaldoCuota = faltante,
                    FechaLimite = DateOnly.FromDateTime(DateTime.Now.AddMonths(1)), // Ejemplo, ajustar según negocio
                    Estado = "PENDIENTE",
                    Pagado = false
                };
                _context.DetalleCredito.Add(nuevaCuota);
            }
        }
        await _context.SaveChangesAsync(cancellationToken);
    }

    // Método auxiliar: valida que el monto del pago no exceda la deuda total de los créditos asociados a las cuotas
    private async Task ValidarMontoNoExcedeDeuda(decimal valorPago, List<int> idsDetalle, CancellationToken cancellationToken)
    {
        var idsCredito = await _context.DetalleCredito
            .Where(d => idsDetalle.Contains(d.IdDetalleCredito))
            .Select(d => d.IdCredito)
            .Distinct()
            .ToListAsync(cancellationToken);

        var saldoTotal = await _context.Credito
            .Where(c => idsCredito.Contains(c.IdCredito))
            .SumAsync(c => c.SaldoPendiente, cancellationToken);

        if (valorPago > saldoTotal)
            throw new Exception($"El monto del pago ({valorPago}) supera la deuda total de los créditos seleccionados ({saldoTotal}).");
    }

    // Método de cálculo de distribución (sin cambios)
    private List<DistribucionItem> CalcularDistribucion(
        List<DetalleCredito> todosDetalles,
        List<PagoCuotaItem> cuotasSolicitud,
        decimal valorTotalPago,
        bool distribuirExcedente)
    {
        var resultado = new List<DistribucionItem>();
        decimal totalAsignado = 0;
        var asignadoPorCuota = new Dictionary<int, decimal>();

        // Aplicar valores especificados
        foreach (var solicitud in cuotasSolicitud)
        {
            if (solicitud.ValorAplicado.HasValue && solicitud.ValorAplicado.Value > 0)
            {
                var detalle = todosDetalles.First(d => d.IdDetalleCredito == solicitud.IdDetalleCredito);
                var saldoDisponible = detalle.SaldoCuota ?? 0;
                var valorAAsignar = Math.Min(solicitud.ValorAplicado.Value, saldoDisponible);
                asignadoPorCuota[solicitud.IdDetalleCredito] = valorAAsignar;
                totalAsignado += valorAAsignar;
            }
            else
            {
                asignadoPorCuota.TryAdd(solicitud.IdDetalleCredito, 0);
            }
        }

        var excedente = valorTotalPago - totalAsignado;

        if (excedente > 0 && distribuirExcedente)
        {
            var cuotasConSaldo = todosDetalles
                .Where(d => (d.SaldoCuota ?? 0) > 0)
                .OrderBy(d => d.FechaLimite)
                .ToList();

            foreach (var cuota in cuotasConSaldo)
            {
                if (excedente <= 0) break;

                var yaAsignado = asignadoPorCuota.GetValueOrDefault(cuota.IdDetalleCredito, 0);
                var saldoRestante = (cuota.SaldoCuota ?? 0) - yaAsignado;

                if (saldoRestante <= 0) continue;

                var valorAAsignar = Math.Min(saldoRestante, excedente);
                asignadoPorCuota[cuota.IdDetalleCredito] = yaAsignado + valorAAsignar;
                excedente -= valorAAsignar;
                totalAsignado += valorAAsignar;
            }
        }

        if (Math.Abs(totalAsignado - valorTotalPago) > 0.01m)
        {
            if (distribuirExcedente)
                throw new Exception($"No se pudo distribuir completamente el pago. Total distribuido: {totalAsignado}, Valor pago: {valorTotalPago}");
            else
                throw new Exception($"El valor total del pago ({valorTotalPago}) no coincide con la suma de valores especificados ({totalAsignado})");
        }

        foreach (var kv in asignadoPorCuota.Where(kv => kv.Value > 0))
        {
            resultado.Add(new DistribucionItem
            {
                IdDetalleCredito = kv.Key,
                ValorAplicado = kv.Value
            });
        }

        return resultado;
    }

    private class DistribucionItem
    {
        public int IdDetalleCredito { get; set; }
        public decimal ValorAplicado { get; set; }
    }
}
