using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class EstudianteBeneficioRepository : IEstudianteBeneficioRepository
{
    private readonly Ammi_OnlineContext _context;

    public EstudianteBeneficioRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<EstudianteBeneficio?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.EstudianteBeneficio
            .Include(eb => eb.IdBeneficioNavigation)
            .AsNoTracking()
            .FirstOrDefaultAsync(eb => eb.IdEstudianteBeneficio == id, cancellationToken);
    }

    public async Task<IEnumerable<EstudianteBeneficio>> GetByAlumnoAsync(int idPersona, CancellationToken cancellationToken)
    {
        return await _context.EstudianteBeneficio
            .Include(eb => eb.IdBeneficioNavigation)
            .Where(eb => eb.IdPersona == idPersona)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Devuelve los beneficios activos y vigentes que aplican al alumno en el ciclo dado.
    /// Un beneficio aplica si: IdCiclo IS NULL (permanente) o IdCiclo = idCiclo.
    /// También verifica FechaFin y Activo.
    /// </summary>
    public async Task<IEnumerable<EstudianteBeneficio>> GetActivosByAlumnoCicloAsync(
        int idPersona,
        int idCiclo,
        CancellationToken cancellationToken)
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);

        return await _context.EstudianteBeneficio
            .Include(eb => eb.IdBeneficioNavigation)
            .Where(eb =>
                eb.IdPersona == idPersona &&
                eb.Activo &&
                eb.FechaInicio <= hoy &&
                (eb.FechaFin == null || eb.FechaFin >= hoy) &&
                eb.IdBeneficioNavigation.Activo &&
                (eb.IdCiclo == null || eb.IdCiclo == idCiclo))
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<EstudianteBeneficio> AddAsync(EstudianteBeneficio entity, CancellationToken cancellationToken)
    {
        entity.FechaAsignacion = DateTime.Now;
        await _context.EstudianteBeneficio.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<EstudianteBeneficio> UpdateAsync(EstudianteBeneficio entity, CancellationToken cancellationToken)
    {
        _context.EstudianteBeneficio.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<EstudianteBeneficio> AsignarBeneficioConAplicacionAsync(
        EstudianteBeneficio entity,
        Beneficio beneficio,
        CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Validar si el estudiante tenia un beneficio activo (se desactivo el beneficio por alguna razon) y se esta intentando asignar el mismo beneficio para el mismo ciclo
            var beneficioInactivo = await _context.EstudianteBeneficio
                .FirstOrDefaultAsync(eb => eb.IdPersona == entity.IdPersona
                                        && eb.IdBeneficio == entity.IdBeneficio
                                        && eb.IdCiclo == entity.IdCiclo
                                        && eb.Activo == false, cancellationToken);

            if (beneficioInactivo != null)
            {
                throw new InvalidOperationException($"El estudiante ya no puede acceder a este beneficio en este ciclo. Motivo: {beneficioInactivo.Observaciones}");
            }

            // Validar si el estudiante ya tiene asignado este beneficio para el mismo ciclo
            bool yaExisteBeneficio = await _context.EstudianteBeneficio
                .AnyAsync(eb => eb.IdPersona == entity.IdPersona 
                             && eb.IdBeneficio == entity.IdBeneficio 
                             && eb.IdCiclo == entity.IdCiclo, cancellationToken);

            if (yaExisteBeneficio)
            {
                throw new InvalidOperationException("El estudiante ya tiene asignado este beneficio para el ciclo especificado.");
            }


 

            // 1. Guardar EstudianteBeneficio
            entity.FechaAsignacion = DateTime.Now;
            await _context.EstudianteBeneficio.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // 2. Obtener IDs de matrícula del alumno (para filtrar créditos)
            var idsMatriculas = await _context.Matricula
                .Where(m => m.IdUsuarioAlumno == entity.IdPersona)
                .Select(m => m.IdMatricula)
                .ToListAsync(cancellationToken);

            if (!idsMatriculas.Any())
            {
                // Si no hay matrículas, no hay créditos; devolvemos la entidad recién creada
                // (podrías lanzar una advertencia, pero no es error)
                var created = await _context.EstudianteBeneficio
                    .Include(eb => eb.IdBeneficioNavigation)
                    .FirstOrDefaultAsync(eb => eb.IdEstudianteBeneficio == entity.IdEstudianteBeneficio, cancellationToken);
                return created!;
            }

            // 3. Construir consulta base de créditos elegibles
            var query = _context.Credito
                .Include(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdEspecieNavigation)
                .Include(c => c.IdEspecieCicloNavigation)
                    .ThenInclude(ec => ec.IdMallaNavigation)
                .Include(c => c.DetalleCredito)
                .Where(c => idsMatriculas.Contains(c.IdMatricula) &&
                            c.Estado != "PAGADO" &&
                            c.SaldoPendiente > 0);

            // 4. Aplicar filtro de especie (según el beneficio)
            query = query.Where(c => c.IdEspecieCicloNavigation.IdEspecie == beneficio.AplicaA);

            // 5. Ejecutar consulta (obtenemos todos los créditos que cumplen, sin filtro de ciclo aún)
            var creditosSinFiltroCiclo = await query.ToListAsync(cancellationToken);

            // 6. Filtrar por ciclo si el beneficio está asociado a un ciclo específico (IdCiclo tiene valor)
            List<Credito> creditos;
            if (entity.IdCiclo.HasValue)
            {
                creditos = creditosSinFiltroCiclo
                    .Where(c => c.IdEspecieCicloNavigation.IdMallaNavigation.IdCiclo == entity.IdCiclo.Value)
                    .ToList();
            }
            else
            {
                creditos = creditosSinFiltroCiclo;
            }

            // Si la lista de créditos está vacía, significa que no hay deudas pendientes
            // (ya sea porque ya están pagadas o porque no existen para esa especie/ciclo).
            if (!creditos.Any())
            {
                throw new InvalidOperationException("No se puede asignar el beneficio porque el crédito correspondiente ya se encuentra pagado o no existen valores pendientes para aplicar.");
            }

            // 7. Para cada crédito, crear CreditoBeneficio y actualizar el crédito
            foreach (var credito in creditos)
            {
                // Evitar duplicados (por si acaso)
                bool existe = await _context.CreditoBeneficio
                    .AnyAsync(cb => cb.IdEstudianteBeneficio == entity.IdEstudianteBeneficio && cb.IdCredito == credito.IdCredito, cancellationToken);
                if (existe) continue;

                decimal valorAplicado;
                if (beneficio.TipoValor == "PORCENTAJE")
                {
                    valorAplicado = credito.MontoOriginal * (beneficio.Valor / 100);
                }
                else // "VALOR FIJO"
                {
                    valorAplicado = beneficio.Valor;
                }

                var creditoBeneficio = new CreditoBeneficio
                {
                    IdCredito = credito.IdCredito,
                    IdBeneficio = beneficio.IdBeneficio,
                    ValorAplicado = valorAplicado,
                    IdEstudianteBeneficio = entity.IdEstudianteBeneficio,
                    FechaAplicacion = DateTime.Now
                };
                await _context.CreditoBeneficio.AddAsync(creditoBeneficio, cancellationToken);

                // Actualizar crédito
                credito.MontoBeneficio = (credito.MontoBeneficio ?? 0) + valorAplicado;
                credito.MontoFinal = credito.MontoOriginal - credito.MontoBeneficio;
                
                // Reducir el saldo pendiente correctamente en lugar de igualarlo al Monto Final (por si ya habia pagos)
                credito.SaldoPendiente -= valorAplicado;
                if (credito.SaldoPendiente < 0) credito.SaldoPendiente = 0;

                _context.Credito.Update(credito);
                
                // Distribuir el descuento a las cuotas (DetalleCredito)
                var cuotasPendientes = credito.DetalleCredito
                    .Where(d => (d.SaldoCuota ?? 0) > 0 && d.Estado != "PAGADA")
                    .OrderBy(d => d.NumeroCuota)
                    .ToList();

                if (cuotasPendientes.Any())
                {
                    decimal montoAReducir = valorAplicado;

                    foreach (var cuota in cuotasPendientes)
                    {
                        if (montoAReducir <= 0) break; // Si ya se agotó el beneficio, salimos

                        // Determinamos cuánto absorbe esta cuota
                        // Toma como máximo lo que tenga de saldo la cuota o lo que queda del beneficio
                        decimal saldoActualCuota = cuota.SaldoCuota ?? 0;
                        decimal descuentoAplicadoACuota = Math.Min(saldoActualCuota, montoAReducir);

                        // Reducimos el valor original (para que refleje el nuevo costo de la cuota) y el saldo
                        cuota.ValorOriginal -= descuentoAplicadoACuota;
                        cuota.SaldoCuota -= descuentoAplicadoACuota;
                        
                        // Si la cuota quedó en 0 por el beneficio, la marcamos como pagada
                        if (cuota.SaldoCuota <= 0)
                        {
                            cuota.SaldoCuota = 0;
                            cuota.Pagado = true;
                            cuota.Estado = "PAGADA";
                        }
                        
                        _context.DetalleCredito.Update(cuota);
                        
                        // Restamos el valor utilizado del beneficio total
                        montoAReducir -= descuentoAplicadoACuota;
                    }
                }
            }

            // 8. Guardar cambios y confirmar transacción
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            // 9. Recargar la entidad con las navegaciones para el DTO
            var createdFinal = await _context.EstudianteBeneficio
                .Include(eb => eb.IdBeneficioNavigation)
                .FirstOrDefaultAsync(eb => eb.IdEstudianteBeneficio == entity.IdEstudianteBeneficio, cancellationToken);
            return createdFinal!;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<bool> DesactivarBeneficioConReversionAsync(
        EstudianteBeneficio entity, 
        CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // 1. Desactivamos el registro principal
            entity.Activo = false;
            entity.FechaEliminado = DateTime.Now;
            _context.EstudianteBeneficio.Update(entity);

            // 2. Buscamos todas las aplicaciones financieras de este beneficio a los créditos que estén activos
            var creditosBeneficios = await _context.CreditoBeneficio
                .Where(cb => cb.IdEstudianteBeneficio == entity.IdEstudianteBeneficio && (cb.Activo == null || cb.Activo == true))
                .ToListAsync(cancellationToken);

            foreach (var cb in creditosBeneficios)
            {
                // 3. Obtenemos el crédito incluyendo las cuotas (DetalleCredito)
                var credito = await _context.Credito
                    .Include(c => c.DetalleCredito)
                    .FirstOrDefaultAsync(c => c.IdCredito == cb.IdCredito, cancellationToken);

                if (credito != null)
                {
                    // 4. Revertimos el descuento a nivel de cabecera del Crédito
                    credito.MontoBeneficio = (credito.MontoBeneficio ?? 0) - cb.ValorAplicado;
                    if (credito.MontoBeneficio < 0) credito.MontoBeneficio = 0;

                    credito.MontoFinal = credito.MontoOriginal - credito.MontoBeneficio;
                    credito.SaldoPendiente += cb.ValorAplicado; 
                    
                    // Si el crédito estaba marcado como PAGADO por culpa del descuento, lo reactivamos
                    if (credito.SaldoPendiente > 0 && credito.Estado == "PAGADO")
                    {
                        credito.Estado = "ACTIVO"; 
                    }

                    _context.Credito.Update(credito);

                    // 5. Buscamos las cuotas (DetalleCredito)
                    // Primero intentamos con las cuotas que no estén pagadas
                    var cuotasPendientes = credito.DetalleCredito
                        .Where(d => d.Estado != "PAGADA")
                        .OrderBy(d => d.NumeroCuota)
                        .ToList();

                    // Si resulta que el beneficio cubrió TODO y todas figuran como "PAGADA", 
                    // tomamos la última cuota para cargarle la deuda revertida.
                    if (!cuotasPendientes.Any())
                    {
                        var ultimaCuota = credito.DetalleCredito.OrderBy(d => d.NumeroCuota).LastOrDefault();
                        if (ultimaCuota != null)
                        {
                            cuotasPendientes.Add(ultimaCuota);
                        }
                        else
                        {
                            throw new InvalidOperationException($"Inconsistencia contable: El crédito {credito.IdCredito} no tiene cuotas disponibles para absorber el valor revertido.");
                        }
                    }

                    // 6. Repartir el valor revertido de forma equitativa entre las cuotas seleccionadas
                    decimal montoAReversar = cb.ValorAplicado;
                    decimal montoPorCuota = Math.Round(montoAReversar / cuotasPendientes.Count, 2);
                    decimal montoAcumulado = 0;

                    for (int i = 0; i < cuotasPendientes.Count; i++)
                    {
                        var cuota = cuotasPendientes[i];
                        
                        // Validar el remanente en la última cuota para no perder centavos
                        decimal montoAsignado = (i == cuotasPendientes.Count - 1) 
                            ? montoAReversar - montoAcumulado 
                            : montoPorCuota;

                        cuota.ValorOriginal += montoAsignado;
                        cuota.SaldoCuota += montoAsignado;

                        // Si la cuota estaba marcada como pagada pero ahora vuelve a tener saldo, la reactivamos
                        if (cuota.SaldoCuota > 0 && (cuota.Pagado == true || cuota.Estado == "PAGADA"))
                        {
                            cuota.Pagado = false;
                            
                            // Determinamos el estado (PARCIAL si ya se le hizo un abono parcial previo, de lo contrario PENDIENTE)
                            cuota.Estado = (cuota.SaldoCuota < cuota.ValorOriginal) ? "PARCIAL" : "PENDIENTE";
                        }

                        _context.DetalleCredito.Update(cuota);
                        montoAcumulado += montoAsignado;
                    }

                    // 7. BORRADO LÓGICO: Mantenemos la información histórica
                    cb.Activo = false;
                    _context.CreditoBeneficio.Update(cb);
                }
            }

            // 8. Guardamos en DB e instruimos Commit
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return true;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
