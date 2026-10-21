using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using AMMI_Online_API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Postulations;

public class GenerarMatriculaRepository : IGenerarMatricula
{
    private readonly Ammi_OnlineContext _context;

    public GenerarMatriculaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<int> CrearMatriculacionManual(
        Usuario usuario,
        Matricula matricula,
        Credito credito,
        DetalleCredito detalleCredito,
        CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await _context.Usuario.AddAsync(usuario, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            await _context.Matricula.AddAsync(matricula, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            credito.IdMatricula = matricula.IdMatricula;
            await _context.Credito.AddAsync(credito, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            detalleCredito.IdCredito = credito.IdCredito;
            await _context.DetalleCredito.AddAsync(detalleCredito, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return matricula.IdMatricula;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<GenerarMatriculaResultado> GenerarMatriculaCompletaAsync(
        int idPersona,
        int idMalla,
        int idMallaParalelo,
        Usuario? nuevoUsuario,
        RolUsuario? rolUsuario,
        CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var resultado = new GenerarMatriculaResultado
            {
                UsuarioCreado = false,
                MatriculaCreada = false
            };

            // A. Validar que MallaParalelo existe y está activo
            var mallaParalelo = await _context.MallaParalelo
                .FirstOrDefaultAsync(mp => mp.IdMallaParalelo == idMallaParalelo, cancellationToken);

            if (mallaParalelo == null || !mallaParalelo.EsActivo)
            {
                throw new InvalidOperationException("El paralelo no está disponible para matrícula (no existe o está inactivo).");
            }

            // B. Validar cupo disponible
            if (mallaParalelo.CupoMaximo.HasValue)
            {
                var matriculados = await _context.Matricula
                    .CountAsync(m => m.IdMallaParalelo == idMallaParalelo, cancellationToken);

                if (matriculados >= mallaParalelo.CupoMaximo.Value)
                {
                    throw new InvalidOperationException("El paralelo ha alcanzado su cupo máximo.");
                }
            }

            // C. Validar que el alumno no esté matriculado en la misma Malla
            var yaMatriculado = await _context.Matricula
                .AnyAsync(m => m.IdUsuarioAlumno == idPersona && m.IdMallaParaleloNavigation.IdMalla == idMalla, cancellationToken);

            if (yaMatriculado)
            {
                throw new InvalidOperationException("El alumno ya se encuentra matriculado en esta malla académica.");
            }

            // 1. Crear usuario si es nuevo
            if (nuevoUsuario != null)
            {
                await _context.Usuario.AddAsync(nuevoUsuario, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                resultado.UsuarioCreado = true;
            }

            // 2. Crear rol de usuario (si no existe)
            if (rolUsuario != null)
            {
                var rolExiste = await _context.RolUsuario
                    .AnyAsync(ru => ru.IdPersona == rolUsuario.IdPersona && ru.IdRol == rolUsuario.IdRol, cancellationToken);

                if (!rolExiste)
                {
                    await _context.RolUsuario.AddAsync(rolUsuario, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }

            // 3. Crear Matricula (ajusta el nombre de la propiedad según tu entidad)
            var matricula = new Matricula
            {
                IdUsuarioAlumno = idPersona,
                IdMallaParalelo = idMallaParalelo,
                IdEstadoMatricula = 1 // Estado: Activa
            };

            await _context.Matricula.AddAsync(matricula, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            resultado.MatriculaCreada = true;
            resultado.IdMatricula = matricula.IdMatricula;

            // 4. Crear DetalleMatricula por cada DetalleMalla
            var detallesMalla = await _context.DetalleMalla
                .Where(dm => dm.IdMalla == idMalla)
                .ToListAsync(cancellationToken);

            foreach (var dm in detallesMalla)
            {
                var existeDetalle = await _context.DetalleMatricula
                    .AnyAsync(d => d.IdMatricula == matricula.IdMatricula
                                && d.IdDetalleMalla == dm.IdDetalleMalla, cancellationToken);

                if (!existeDetalle)
                {
                    await _context.DetalleMatricula.AddAsync(new DetalleMatricula
                    {
                        IdMatricula = matricula.IdMatricula,
                        IdDetalleMalla = dm.IdDetalleMalla
                    }, cancellationToken);
                    resultado.DetallesMatriculaGenerados++;
                }
            }
            await _context.SaveChangesAsync(cancellationToken);

            // 5. Obtener el ciclo asociado a la malla
            var malla = await _context.Malla
                .Include(m => m.IdCicloNavigation)
                .FirstOrDefaultAsync(m => m.IdMalla == idMalla, cancellationToken);

            var cicloActivo = malla?.IdCicloNavigation;

            if (cicloActivo == null)
            {
                throw new InvalidOperationException($"No se encontró ningún ciclo asociado a la Malla ID {idMalla}. Verifique la columna 'id_ciclo' en la tabla 'malla'.");
            }

            // 6. Obtener todas las EspecieCiclo activas de la malla, sin duplicados por IdEspecie
            var todasEspeciesCiclo = await _context.EspecieCiclo
                .Include(ec => ec.IdEspecieNavigation)
                .Where(ec => ec.IdMalla == idMalla 
                          && ec.IdEspecieNavigation.Activo 
                          && (ec.IdEspecieNavigation.EsMatricula || ec.IdEspecieNavigation.EsPension))
                .ToListAsync(cancellationToken);

            // Deduplicar por IdEspecie (precaución mientras no haya unique constraint en DB)
            var especiesCiclo = todasEspeciesCiclo
                .GroupBy(ec => ec.IdEspecie)
                .Select(g => g.First())
                .ToList();

            if (!especiesCiclo.Any())
                throw new InvalidOperationException(
                    $"La malla ID {idMalla} no tiene especies activas configuradas. " +
                    "Configure al menos una especie de tipo Matrícula y una de tipo Pensión.");

            if (!especiesCiclo.Any(ec => ec.IdEspecieNavigation.EsMatricula))
                throw new InvalidOperationException(
                    $"La malla ID {idMalla} no tiene una especie de tipo Matrícula activa. " +
                    "No se pueden generar los créditos de matrícula.");

            if (!especiesCiclo.Any(ec => ec.IdEspecieNavigation.EsPension))
                throw new InvalidOperationException(
                    $"La malla ID {idMalla} no tiene una especie de tipo Pensión activa. " +
                    "No se pueden generar los créditos de pensión.");

            // 7. Crear Créditos por cada EspecieCiclo
            foreach (var especieCiclo in especiesCiclo)
            {
                // Verificar duplicado por IdEspecie (no solo por IdEspecieCiclo) para evitar
                // créditos repetidos si existen múltiples EspecieCiclo con la misma especie
                var existeCredito = await _context.Credito
                    .Join(_context.EspecieCiclo,
                          c => c.IdEspecieCiclo,
                          ec => ec.IdEspecieCiclo,
                          (c, ec) => new { c.IdMatricula, ec.IdEspecie })
                    .AnyAsync(x => x.IdMatricula == matricula.IdMatricula
                                && x.IdEspecie == especieCiclo.IdEspecie,
                              cancellationToken);

                if (!existeCredito)
                {
                    var especie = especieCiclo.IdEspecieNavigation;
                    var esDiferible = (especie?.EsPension ?? false) && !(especie?.EsMatricula ?? false);
                    var valorEspecie = especieCiclo.ValorEspecie;

                    // Crear el crédito
                    var credito = new Credito
                    {
                        IdMatricula = matricula.IdMatricula,
                        IdEspecieCiclo = especieCiclo.IdEspecieCiclo,
                        MontoOriginal = valorEspecie,
                        MontoBeneficio = null,
                        MontoFinal = valorEspecie,
                        SaldoPendiente = valorEspecie,
                        // Si es diferible, el saldo pendiente es 0 porque la deuda se genera al diferir
                        Estado = esDiferible ? "PENDIENTE_DIFERIR" : "ACTIVO",
                        FechaGeneracion = DateOnly.FromDateTime(DateTime.Now),
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };

                    await _context.Credito.AddAsync(credito, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                    resultado.CreditosGenerados++;

                    // APLICAR BENEFICIOS
                    var idEspecie = especieCiclo.IdEspecie;
                    var montoBeneficio = await AplicarBeneficiosACreditoAsync(
                        idPersona: idPersona,
                        idCiclo: cicloActivo.IdCiclo,
                        idCredito: credito.IdCredito,
                        idEspecie: idEspecie,
                        montoOriginal: valorEspecie,
                        cancellationToken);

                    credito.MontoBeneficio = montoBeneficio;
                    credito.MontoFinal = valorEspecie - montoBeneficio;
                    credito.SaldoPendiente = credito.MontoFinal.Value;
                    
                    _context.Credito.Update(credito);
                    await _context.SaveChangesAsync(cancellationToken);

                    // 8. Si la especie NO es diferible, crear el DetalleCredito (una sola cuota)
                    if (!esDiferible)
                    {
                        var detalleCredito = new DetalleCredito
                        {
                            IdCredito = credito.IdCredito,
                            NumeroCuota = 1,
                            ValorOriginal = credito.MontoFinal.Value,
                            SaldoCuota = credito.MontoFinal.Value,
                            FechaLimite = null,
                            Estado = "PENDIENTE",
                            Pagado = false
                        };

                        await _context.DetalleCredito.AddAsync(detalleCredito, cancellationToken);
                        await _context.SaveChangesAsync(cancellationToken);
                        resultado.DetallesCreditoGenerados++;
                    }
                    // Si es diferible, no se crea detalle (se generará cuando el estudiante solicite el diferimiento)
                }
            }

            // 9. Aplicar saldo a favor automático si existe
            var saldoFavor = await _context.SaldoFavorAlumno
                .FirstOrDefaultAsync(sf => sf.IdPersona == idPersona, cancellationToken);

            if (saldoFavor != null && (saldoFavor.Saldo ?? 0) > 0)
            {
                // Obtener todos los detalles de crédito activos recién creados para esta matrícula
                var detallesRecienCreados = await _context.DetalleCredito
                    .Include(dc => dc.IdCreditoNavigation)
                    .Where(dc => dc.IdCreditoNavigation.IdMatricula == matricula.IdMatricula && !dc.Pagado)
                    .ToListAsync(cancellationToken);

                foreach (var dc in detallesRecienCreados)
                {
                    if ((saldoFavor.Saldo ?? 0) <= 0) break;

                    var montoAAplicar = Math.Min(saldoFavor.Saldo ?? 0, dc.SaldoCuota ?? 0);
                    if (montoAAplicar > 0)
                    {
                        // 1. Descontar del saldo a favor
                        saldoFavor.Saldo -= montoAAplicar;
                        saldoFavor.UpdatedAt = DateTime.Now;
                        _context.SaldoFavorAlumno.Update(saldoFavor);

                        // 2. Descontar del detalle del crédito (cuota)
                        dc.SaldoCuota -= montoAAplicar;
                        if (dc.SaldoCuota <= 0)
                        {
                            dc.SaldoCuota = 0;
                            dc.Pagado = true;
                            dc.Estado = "PAGADA";
                        }
                        else
                        {
                            dc.Estado = "PARCIAL";
                        }
                        _context.DetalleCredito.Update(dc);

                        // 3. Descontar del crédito principal
                        var cred = dc.IdCreditoNavigation;
                        cred.SaldoPendiente -= montoAAplicar;
                        if (cred.SaldoPendiente <= 0)
                        {
                            cred.SaldoPendiente = 0;
                            cred.Estado = "CANCELADO";
                        }
                        cred.UpdatedAt = DateTime.Now;
                        _context.Credito.Update(cred);

                        // 4. Registrar movimiento
                        var movimiento = new SaldoFavorMovimiento
                        {
                            IdSaldoFavor = saldoFavor.IdSaldoFavor,
                            Monto = -montoAAplicar,
                            Concepto = $"Aplicado automáticamente a cuota #{dc.NumeroCuota} - Matrícula #{matricula.IdMatricula}",
                            IdCredito = dc.IdCredito,
                            IdDetalleCredito = dc.IdDetalleCredito,
                            FechaMovimiento = DateTime.Now
                        };
                        _context.SaldoFavorMovimiento.Add(movimiento);
                    }
                }
                
                await _context.SaveChangesAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
            return resultado;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<Matricula> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Matricula
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.IdMatricula == id, cancellationToken);
    }

    public async Task<Matricula> UpdateAsync(Matricula matricula, CancellationToken cancellationToken)
    {
        _context.Matricula.Update(matricula);
        await _context.SaveChangesAsync(cancellationToken);
        return matricula;
    }

    public async Task<bool> ExisteUsuarioPorIdPersonaAsync(int idPersona, CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .AnyAsync(u => u.IdPersona == idPersona, cancellationToken);
    }

    public async Task<bool> ExisteMatriculaParaUsuarioAsync(int idUsuarioAlumno, CancellationToken cancellationToken)
    {
        return await _context.Matricula
            .AnyAsync(m => m.IdUsuarioAlumno == idUsuarioAlumno, cancellationToken);
    }

    public async Task<CambiarParaleloResultado> CambiarParaleloAsync(
        int idMatricula,
        int idMallaParaleloNuevo,
        CancellationToken cancellationToken)
    {
        // Cargar matrícula con su paralelo actual y todos sus detalles+notas
        var matricula = await _context.Matricula
            .Include(m => m.IdMallaParaleloNavigation)
            .Include(m => m.DetalleMatricula)
                .ThenInclude(dm => dm.NotasAlumno)
            .FirstOrDefaultAsync(m => m.IdMatricula == idMatricula, cancellationToken);

        if (matricula == null)
            throw new InvalidOperationException("Matrícula no encontrada.");

        if (matricula.IdMallaParalelo == idMallaParaleloNuevo)
            throw new InvalidOperationException("El alumno ya se encuentra en ese paralelo.");

        var idMalla = matricula.IdMallaParaleloNavigation.IdMalla;

        // Cargar el nuevo paralelo con sus distributivos activos y alumnos actuales
        var nuevoParalelo = await _context.MallaParalelo
            .Include(mp => mp.Distributivo.Where(d => d.Activo == true))
            .Include(mp => mp.Matricula)
            .FirstOrDefaultAsync(mp => mp.IdMallaParalelo == idMallaParaleloNuevo, cancellationToken);

        if (nuevoParalelo == null)
            throw new InvalidOperationException("El paralelo destino no existe.");

        // Validación 1: misma malla
        if (nuevoParalelo.IdMalla != idMalla)
            throw new InvalidOperationException("El paralelo destino pertenece a una malla diferente.");

        // Validación 2: paralelo activo
        if (!nuevoParalelo.EsActivo)
            throw new InvalidOperationException("El paralelo destino no está activo.");

        // Validación 3: distributivos completos (uno activo por cada DetalleMalla de la malla)
        var totalMaterias = await _context.DetalleMalla
            .AsNoTracking()
            .CountAsync(dm => dm.IdMalla == idMalla, cancellationToken);

        var distributivosCubiertos = nuevoParalelo.Distributivo
            .Select(d => d.IdDetalleMalla)
            .Distinct()
            .Count();

        if (distributivosCubiertos < totalMaterias)
            throw new InvalidOperationException(
                $"El paralelo destino no tiene todos los distributivos configurados. " +
                $"Materias requeridas: {totalMaterias}, cubiertas: {distributivosCubiertos}.");

        // Advertencia de cupo (no bloquea)
        string? advertencia = null;
        if (nuevoParalelo.CupoMaximo.HasValue)
        {
            var alumnosActuales = nuevoParalelo.Matricula.Count;
            if (alumnosActuales >= nuevoParalelo.CupoMaximo.Value)
                advertencia = $"El paralelo destino ha alcanzado su cupo máximo ({nuevoParalelo.CupoMaximo.Value} alumnos). El cambio se realizó igualmente.";
        }

        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Borrar notas si existen
            bool notasBorradas = false;
            foreach (var detalle in matricula.DetalleMatricula)
            {
                if (detalle.NotasAlumno.Any())
                {
                    _context.NotasAlumno.RemoveRange(detalle.NotasAlumno);
                    notasBorradas = true;
                }

                detalle.NotaFinal = null;
                detalle.ExamenRemedial = null;
                detalle.Aprobado = null;
            }

            // Cambiar paralelo
            matricula.IdMallaParalelo = idMallaParaleloNuevo;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new CambiarParaleloResultado
            {
                NotasBorradas = notasBorradas,
                Advertencia = advertencia
            };
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task EliminarRolUsuarioAsync(int idPersona, int idRol, CancellationToken cancellationToken)
    {
        var rolUsuario = await _context.RolUsuario
            .FirstOrDefaultAsync(ru => ru.IdPersona == idPersona && ru.IdRol == idRol, cancellationToken);

        if (rolUsuario != null)
        {
            _context.RolUsuario.Remove(rolUsuario);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    /// <summary>
    /// Consulta los beneficios activos del alumno para el ciclo dado,
    /// calcula los descuentos acumulativos con tope al 100% del monto,
    /// persiste los CreditoBeneficio y retorna el monto total descontado.
    /// </summary>
    private async Task<decimal> AplicarBeneficiosACreditoAsync(
        int idPersona,
        int idCiclo,
        int idCredito,
        int idEspecie,
        decimal montoOriginal,
        CancellationToken cancellationToken)
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);

        var beneficiosAlumno = await _context.EstudianteBeneficio
            .Include(eb => eb.IdBeneficioNavigation)
            .Where(eb =>
                eb.IdPersona == idPersona &&
                eb.Activo &&
                eb.FechaInicio <= hoy &&
                (eb.FechaFin == null || eb.FechaFin >= hoy) &&
                eb.IdBeneficioNavigation.Activo &&
                eb.IdBeneficioNavigation.AplicaA == idEspecie &&
                (eb.IdCiclo == null || eb.IdCiclo == idCiclo))
            .ToListAsync(cancellationToken);

        if (!beneficiosAlumno.Any())
            return 0m;

        // Calcular descuento teórico de cada beneficio
        decimal sumaDescuentos = 0m;
        var descuentosPorBeneficio = new List<(EstudianteBeneficio eb, decimal descuento)>();

        foreach (var eb in beneficiosAlumno)
        {
            var b = eb.IdBeneficioNavigation;
            var descuento = b.TipoValor == "PORCENTAJE"
                ? Math.Round(montoOriginal * (b.Valor / 100m), 2)
                : b.Valor;

            descuentosPorBeneficio.Add((eb, descuento));
            sumaDescuentos += descuento;
        }

        // Aplicar tope al 100% del monto original
        var montoBeneficio = Math.Min(sumaDescuentos, montoOriginal);
        var factorTope = sumaDescuentos > 0 ? montoBeneficio / sumaDescuentos : 0m;

        // Registrar un CreditoBeneficio por cada beneficio aplicado
        var registros = descuentosPorBeneficio.Select(x => new CreditoBeneficio
        {
            IdCredito = idCredito,
            IdBeneficio = x.eb.IdBeneficio,
            IdEstudianteBeneficio = x.eb.IdEstudianteBeneficio,
            ValorAplicado = Math.Round(x.descuento * factorTope, 2),
            FechaAplicacion = DateTime.Now,
            Activo = true
        }).ToList();

        await _context.CreditoBeneficio.AddRangeAsync(registros, cancellationToken);
        // El SaveChanges se hará afuera o aquí si se prefiere
        await _context.SaveChangesAsync(cancellationToken);

        return montoBeneficio;
    }
}