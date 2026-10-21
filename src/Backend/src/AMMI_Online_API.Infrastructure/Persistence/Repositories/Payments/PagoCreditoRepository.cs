using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class PagoCreditoRepository : IPagoCreditoRepository
{
    private readonly Ammi_OnlineContext _context;
    private readonly ISaldoFavorRepository _saldoFavorRepo;

    public PagoCreditoRepository(Ammi_OnlineContext context, ISaldoFavorRepository saldoFavorRepo)
    {
        _context = context;
        _saldoFavorRepo = saldoFavorRepo;
    }


    // Método simple: solo guarda el pago (sin cuotas ni distribución)
    public async Task<int> CrearPagoAsync(Pago pago, CancellationToken cancellationToken)
    {
        _context.Pago.Add(pago);
        await _context.SaveChangesAsync(cancellationToken);
        return pago.IdPago;
    }

    // Crea un pago no validado con sus cuotas asociadas (de momento no nos sirve)
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

            // Cambiar estado de los detalles a PAGADA (aunque el pago aún no está validado, esto es solo para marcar que ya tienen un pago asociado)
            foreach (var detalle in detalles)
            {
                detalle.Estado = "PAGADA";
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
        if (cuotasSolicitud == null || !cuotasSolicitud.Any())
        {
            throw new ArgumentException("La lista de cuotas no puede estar vacía", nameof(cuotasSolicitud));
        }

        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Obtener los créditos involucrados
            var idsDetalle = cuotasSolicitud.Select(c => c.IdDetalleCredito).Distinct().ToList();
            var detallesSolicitados = await _context.DetalleCredito
                .Where(d => idsDetalle.Contains(d.IdDetalleCredito))
                .Include(d => d.IdCreditoNavigation)
                    .ThenInclude(c => c.IdMatriculaNavigation)
                        .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                .ToListAsync(cancellationToken);

            if (detallesSolicitados.Count != idsDetalle.Count)
            {
                var encontrados = detallesSolicitados.Select(d => d.IdDetalleCredito).ToList();
                var noEncontrados = idsDetalle.Except(encontrados);
                throw new Exception($"Las siguientes cuotas no existen: {string.Join(", ", noEncontrados)}");
            }

            // Obtener las matrículas de los créditos involucrados
            var idsMatricula = detallesSolicitados.Select(d => d.IdCreditoNavigation.IdMatricula).Distinct().ToList();

            // Obtener TODOS los créditos de esas matrículas
            var todosIdsCredito = await _context.Credito
                .Where(c => idsMatricula.Contains(c.IdMatricula))
                .Select(c => c.IdCredito)
                .ToListAsync(cancellationToken);

            // Asegurar que cada crédito tenga cuotas suficientes
            await AsegurarCuotasDeCredito(todosIdsCredito, cancellationToken);

            // Recargar todos los detalles de esos créditos (reemplazar la consulta actual por esta)
            var todosDetalles = await _context.DetalleCredito
                .Include(d => d.IdCreditoNavigation)
                .Where(d => todosIdsCredito.Contains(d.IdCredito))
                .OrderBy(d => d.FechaLimite)
                .ToListAsync(cancellationToken);

            // Convertir las cuotas solicitadas a PagoCuotaItem y calcular distribución
            var cuotasSolicitudItems = cuotasSolicitud.Select(c => new PagoCuotaItem
            {
                IdDetalleCredito = c.IdDetalleCredito,
                ValorAplicado = c.ValorAplicado // Puede ser null o 0
            }).ToList();

            var distribucion = CalcularDistribucion(todosDetalles, cuotasSolicitudItems, pago.ValorPago, distribuirExcedente);

            _context.Pago.Add(pago);
            await _context.SaveChangesAsync(cancellationToken);

            // Registrar PagoCuota y actualizar saldos
            foreach (var item in distribucion.Items)
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
                    detalle.SaldoCuota = 0; // Evitar negativos por seguridad
                    detalle.Pagado = true;
                    detalle.Estado = "PAGADA";
                }
                else
                {
                    detalle.Estado = detalle.FechaLimite.HasValue && detalle.FechaLimite < DateOnly.FromDateTime(DateTime.Now) ? "VENCIDA" : "PARCIAL";
                }

                _context.DetalleCredito.Update(detalle);

                // --- 2. NUEVO: ACTUALIZAR EL CREDITO PRINCIPAL ---
                if (detalle.IdCreditoNavigation != null)
                {
                    detalle.IdCreditoNavigation.SaldoPendiente -= item.ValorAplicado;
                    
                    if (detalle.IdCreditoNavigation.SaldoPendiente <= 0)
                    {
                        detalle.IdCreditoNavigation.SaldoPendiente = 0;
                        detalle.IdCreditoNavigation.Estado = "CANCELADO";
                    }
                    _context.Credito.Update(detalle.IdCreditoNavigation);
                }
            }

            // GESTIÓN DE SALDO A FAVOR
            if (distribucion.Excedente > 0)
            {
                var idPersona = detallesSolicitados.First().IdCreditoNavigation.IdMatriculaNavigation.IdUsuarioAlumnoNavigation.IdPersona;
                await _saldoFavorRepo.AgregarSaldoAsync(idPersona, distribucion.Excedente,
                    $"Excedente de pago #{pago.IdPago}", detallesSolicitados.First().IdCredito, cancellationToken);
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return pago.IdPago;
        }
        catch (OperationCanceledException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            throw;
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None);
            throw;
        }
    }


    // Valida un pago existente (pendiente) y opcionalmente lo aprueba en la misma transacción
    public async Task AplicarDistribucionAPagoAsync(
        int idPago,
        List<PagoCuota>? cuotasSolicitud,
        bool distribuirExcedente,
        CancellationToken cancellationToken,
        bool aprobarPago = false,
        int? usuarioAprueba = null)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var pago = await _context.Pago
                .FirstOrDefaultAsync(p => p.IdPago == idPago, cancellationToken);
            if (pago == null)
                throw new Exception($"El pago con ID {idPago} no existe.");

            // Validar que solo se pueden aprobar pagos en estado PENDIENTE
            if (aprobarPago && pago.IdEstadoPago != 1)
                throw new Exception("Solo se pueden aprobar pagos en estado PENDIENTE.");

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
                    .ThenInclude(c => c.IdMatriculaNavigation)
                        .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                .Where(d => idsDetalle.Contains(d.IdDetalleCredito))
                .ToListAsync(cancellationToken);
            if (detalles.Count != idsDetalle.Count)
            {
                var encontrados = detalles.Select(d => d.IdDetalleCredito).ToList();
                var noEncontrados = idsDetalle.Except(encontrados);
                throw new Exception($"Las siguientes cuotas no existen: {string.Join(", ", noEncontrados)}");
            }

            // Obtener las matrículas de los créditos involucrados
            var idsMatricula = detalles.Select(d => d.IdCreditoNavigation.IdMatricula).Distinct().ToList();

            // Obtener TODOS los créditos de esas matrículas
            var todosIdsCredito = await _context.Credito
                .Where(c => idsMatricula.Contains(c.IdMatricula))
                .Select(c => c.IdCredito)
                .ToListAsync(cancellationToken);

            // Asegurar que cada crédito tenga cuotas suficientes
            await AsegurarCuotasDeCredito(todosIdsCredito, cancellationToken);

            // Recargar todos los detalles de esos créditos (ahora con las nuevas cuotas)
            var todosDetalles = await _context.DetalleCredito
                .Include(d => d.IdCreditoNavigation)
                .Where(d => todosIdsCredito.Contains(d.IdCredito))
                .OrderBy(d => d.IdCreditoNavigation.FechaGeneracion) 
                .ThenBy(d => d.FechaLimite)
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
            var nuevasCuotas = distribucion.Items.Select(item => new PagoCuota
            {
                IdPago = idPago,
                IdDetalleCredito = item.IdDetalleCredito,
                ValorAplicado = item.ValorAplicado
            }).ToList();
            _context.PagoCuota.AddRange(nuevasCuotas);

            // Actualizar los detalles de crédito
            foreach (var item in distribucion.Items)
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

                // --- ACTUALIZAR EL CREDITO PRINCIPAL ---
                if (detalle.IdCreditoNavigation != null)
                {
                    detalle.IdCreditoNavigation.SaldoPendiente -= item.ValorAplicado;
                    if (detalle.IdCreditoNavigation.SaldoPendiente <= 0)
                    {
                        detalle.IdCreditoNavigation.SaldoPendiente = 0;
                        detalle.IdCreditoNavigation.Estado = "CANCELADO";
                    }
                    _context.Credito.Update(detalle.IdCreditoNavigation);
                }
            }

            // GESTIÓN DE SALDO A FAVOR
            if (distribucion.Excedente > 0)
            {
                var idPersona = detalles.First().IdCreditoNavigation.IdMatriculaNavigation.IdUsuarioAlumnoNavigation.IdPersona;
                await _saldoFavorRepo.AgregarSaldoAsync(idPersona, distribucion.Excedente, 
                    $"Excedente de validación pago #{pago.IdPago}", detalles.First().IdCredito, cancellationToken);
            }

            // Cambiar estado a APROBADO dentro de la misma transacción (atómico)
            if (aprobarPago)
            {
                pago.IdEstadoPago = 2;
                pago.UsuarioAprueba = usuarioAprueba;
                pago.FechaAprobacion = DateTime.Now;
                _context.Pago.Update(pago);
            }

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
        // Obtener los IdMatricula de los créditos asociados a los detalles seleccionados
        var idsMatricula = await _context.DetalleCredito
            .Where(d => idsDetalle.Contains(d.IdDetalleCredito))
            .Select(d => d.IdCreditoNavigation.IdMatricula) // Ajusta según tu modelo
            .Distinct()
            .ToListAsync(cancellationToken);

        if (!idsMatricula.Any())
            throw new Exception("No se encontraron matrículas asociadas a las cuotas seleccionadas.");

        // Sumar saldo pendiente de TODOS los créditos de esas matrículas
        var saldoTotal = await _context.Credito
            .Where(c => idsMatricula.Contains(c.IdMatricula))
            .SumAsync(c => c.SaldoPendiente, cancellationToken);

        // Ya no lanzamos excepción, el excedente se irá a Saldo a Favor
        // if (valorPago > saldoTotal)
        //     throw new Exception($"El monto del pago ({valorPago}) supera la deuda total...");
    }

    // Distribución de pago refactorizada para retornar excedente
    private DistribucionResultado CalcularDistribucion(
        List<DetalleCredito> todosDetalles,
        List<PagoCuotaItem> cuotasSolicitud,
        decimal valorTotalPago,
        bool distribuirExcedente)
    {
        var items = new List<DistribucionItem>();
        decimal totalAsignado = 0;
        var asignadoPorCuota = new Dictionary<int, decimal>();

        // Paso 1: Identificar valores explícitos (>0)
        var cuotasConValorExplicito = cuotasSolicitud
            .Where(c => c.ValorAplicado.HasValue && c.ValorAplicado.Value > 0)
            .ToList();

        if (cuotasConValorExplicito.Any())
        {
            foreach (var solicitud in cuotasConValorExplicito)
            {
                var detalle = todosDetalles.FirstOrDefault(d => d.IdDetalleCredito == solicitud.IdDetalleCredito);
                if (detalle == null) continue;

                var saldoDisponible = detalle.SaldoCuota ?? 0;
                var valorAAsignar = Math.Min(solicitud.ValorAplicado.Value, saldoDisponible);
                asignadoPorCuota[solicitud.IdDetalleCredito] = valorAAsignar;
                totalAsignado += valorAAsignar;
            }
        }
        else
        {
            // Si no hay valores explícitos, inicializar las solicitadas con 0
            foreach (var solicitud in cuotasSolicitud)
            {
                asignadoPorCuota[solicitud.IdDetalleCredito] = 0;
            }
        }

        var saldoRestanteDelPago = valorTotalPago - totalAsignado;

        // Paso 2: Distribuir el excedente si corresponde
        if (saldoRestanteDelPago > 0.001m && distribuirExcedente)
        {
            // Obtener los IDs de los créditos involucrados en las cuotas solicitadas
            var idsDetalleSolicitados = cuotasSolicitud.Select(c => c.IdDetalleCredito).ToHashSet();
            var idsCreditoSolicitados = todosDetalles
                .Where(d => idsDetalleSolicitados.Contains(d.IdDetalleCredito))
                .Select(d => d.IdCredito)
                .Distinct()
                .ToHashSet();

            // Obtener todas las cuotas que aún tienen saldo después de las asignaciones explícitas
            var cuotasConSaldo = todosDetalles
                .Where(d => (d.SaldoCuota ?? 0) > 0)
                .Select(d => new { Detalle = d, YaAsignado = asignadoPorCuota.GetValueOrDefault(d.IdDetalleCredito, 0) })
                .Where(x => x.Detalle.SaldoCuota - x.YaAsignado > 0.001m)
                .Select(x => x.Detalle)
                .ToList();

            // Ordenar: primero las cuotas de créditos solicitados, luego las demás.
            // Dentro de cada grupo, ordenar por fecha límite (y luego por ID para consistencia)
            var cuotasOrdenadas = cuotasConSaldo
                .OrderBy(d => !idsCreditoSolicitados.Contains(d.IdCredito))  // primero los de créditos solicitados
                .ThenBy(d => d.FechaLimite)
                .ThenBy(d => d.IdDetalleCredito)
                .ToList();

            foreach (var cuota in cuotasOrdenadas)
            {
                if (saldoRestanteDelPago <= 0.001m) break;

                var yaAsignado = asignadoPorCuota.GetValueOrDefault(cuota.IdDetalleCredito, 0);
                var saldoRestanteCuota = (cuota.SaldoCuota ?? 0) - yaAsignado;

                if (saldoRestanteCuota <= 0.001m) continue;

                var valorAAsignar = Math.Min(saldoRestanteCuota, saldoRestanteDelPago);
                asignadoPorCuota[cuota.IdDetalleCredito] = yaAsignado + valorAAsignar;
                saldoRestanteDelPago -= valorAAsignar;
                totalAsignado += valorAAsignar;
            }
        }

        // Paso 3: Crear la lista de items con valores > 0
        foreach (var kv in asignadoPorCuota.Where(kv => kv.Value > 0))
        {
            items.Add(new DistribucionItem
            {
                IdDetalleCredito = kv.Key,
                ValorAplicado = kv.Value
            });
        }

        return new DistribucionResultado
        {
            Items = items,
            Excedente = Math.Max(0, valorTotalPago - totalAsignado)
        };
    }

    private class DistribucionResultado
    {
        public List<DistribucionItem> Items { get; set; } = new();
        public decimal Excedente { get; set; }
    }

    public async Task CancelarPagoAsync(int idPago, int usuarioElimino, string Observaciones, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Obtener el pago con sus cuotas y los detalles de crédito asociados
            var pago = await _context.Pago
                .Include(p => p.PagoCuota)
                    .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                        .ThenInclude(dc => dc.IdCreditoNavigation)
                .FirstOrDefaultAsync(p => p.IdPago == idPago, cancellationToken);

            if (pago == null)
                throw new Exception($"El pago con ID {idPago} no existe.");

            // Verificar si ya está cancelado
            const int ID_ESTADO_CANCELADO = 4;
            if (pago.IdEstadoPago == ID_ESTADO_CANCELADO || pago.FechaEliminacion != null)
                throw new Exception("El pago ya está cancelado.");

            // Revertir efectos en las cuotas solo si hubo distribución (ValorAplicado > 0)
            foreach (var pagoCuota in pago.PagoCuota.Where(pc => pc.ValorAplicado > 0))
            {
                var detalle = pagoCuota.IdDetalleCreditoNavigation;
                if (detalle != null)
                {
                    // Restaurar el saldo sumando el valor aplicado
                    detalle.SaldoCuota = (detalle.SaldoCuota ?? 0) + pagoCuota.ValorAplicado;

                    // Recalcular estado de la cuota
                    if (detalle.SaldoCuota <= 0)
                    {
                        detalle.Pagado = true;
                        detalle.Estado = "PAGADA";
                    }
                    else
                    {
                        detalle.Pagado = false;
                        if (detalle.FechaLimite.HasValue && detalle.FechaLimite < DateOnly.FromDateTime(DateTime.Now))
                            detalle.Estado = "VENCIDA";
                        else
                            detalle.Estado = "PENDIENTE";
                    }
                    _context.DetalleCredito.Update(detalle);

                    // Restaurar el saldo del crédito sumando el valor aplicado
                    if (detalle.IdCreditoNavigation != null)
                    {
                        detalle.IdCreditoNavigation.SaldoPendiente += pagoCuota.ValorAplicado;
                        detalle.IdCreditoNavigation.Estado = "ACTIVO";
                        _context.Credito.Update(detalle.IdCreditoNavigation);
                    }
                }
            }

            // Actualizar el pago: estado CANCELADO, fecha y usuario eliminación
            pago.IdEstadoPago = ID_ESTADO_CANCELADO;
            pago.FechaEliminacion = DateTime.Now;
            pago.UsuarioElimino = usuarioElimino;
            pago.Observaciones = Observaciones;
            _context.Pago.Update(pago);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<int> CrearPagoPendienteSinDistribucionAsync(Pago pago, List<PagoCuota> cuotas, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            pago.IdEstadoPago = 1;

            _context.Pago.Add(pago);
            await _context.SaveChangesAsync(cancellationToken);

            foreach (var cuota in cuotas)
            {
                cuota.IdPago = pago.IdPago;
                cuota.ValorAplicado = 0;
                _context.PagoCuota.Add(cuota);
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

    public async Task AprobarPagoAsync(int idPago, int? usuarioAprueba, CancellationToken cancellationToken)
    {
        var pago = await _context.Pago.FirstOrDefaultAsync(p => p.IdPago == idPago, cancellationToken);
        if (pago == null)
            throw new Exception($"El pago con ID {idPago} no existe.");

        if (pago.IdEstadoPago != 1)
            throw new Exception("Solo se pueden aprobar pagos en estado PENDIENTE.");

        pago.IdEstadoPago = 2;
        pago.UsuarioAprueba = usuarioAprueba;
        pago.FechaAprobacion = DateTime.Now;
        _context.Pago.Update(pago);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task RechazarPagoAsync(int idPago, string? observaciones, CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var pago = await _context.Pago
                .Include(p => p.PagoCuota)
                .FirstOrDefaultAsync(p => p.IdPago == idPago, cancellationToken);

            if (pago == null)
                throw new Exception($"El pago con ID {idPago} no existe.");

            if (pago.IdEstadoPago != 1)
                throw new Exception("Solo se pueden rechazar pagos en estado PENDIENTE.");

            // Conservar las cuotas asociadas para no perder la relación con el alumno (se quedan con ValorAplicado = 0)
            // _context.PagoCuota.RemoveRange(pago.PagoCuota);

            pago.IdEstadoPago = 3;
            pago.Observaciones = observaciones;
            _context.Pago.Update(pago);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<Pago?> ObtenerPagoConCuotasAsync(int idPago, CancellationToken cancellationToken)
    {
        return await _context.Pago
            .Include(p => p.PagoCuota)
            .FirstOrDefaultAsync(p => p.IdPago == idPago, cancellationToken);
    }

    public async Task<Pago?> ObtenerPagoConDetallesCompletosAsync(int idPago, CancellationToken cancellationToken)
    {
        return await _context.Pago
            .Include(p => p.IdClienteNavigation)
            .Include(p => p.IdTipoPagoNavigation)
            .Include(p => p.IdCuentaBancariaNavigation)
            .Include(p => p.IdEstadoPagoNavigation)
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdMatriculaNavigation)
                            .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                                .ThenInclude(u => u.IdPersonaNavigation)
                                    .ThenInclude(pers => pers.DatosContacto)
            .Include(p => p.PagoCuota)
                .ThenInclude(pc => pc.IdDetalleCreditoNavigation)
                    .ThenInclude(dc => dc.IdCreditoNavigation)
                        .ThenInclude(c => c.IdEspecieCicloNavigation)
                            .ThenInclude(ec => ec.IdEspecieNavigation)
            .FirstOrDefaultAsync(p => p.IdPago == idPago, cancellationToken);
    }

    public async Task ActualizarObservacionAsync(int idPago, string? observaciones, CancellationToken cancellationToken)
    {
        var pago = await _context.Pago.FirstOrDefaultAsync(p => p.IdPago == idPago, cancellationToken);
        if (pago == null)
            throw new KeyNotFoundException($"El pago con ID {idPago} no existe.");

        pago.Observaciones = observaciones;
        await _context.SaveChangesAsync(cancellationToken);
    }

    private class DistribucionItem
    {
        public int IdDetalleCredito { get; set; }
        public decimal ValorAplicado { get; set; }
    }
}
