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
        int idParalelo,
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
                IdUsuarioAlumno = idPersona, // O IdPersona, según corresponda
                IdParalelo = idParalelo
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

            // 6. Obtener todas las EspecieCiclo del ciclo, incluyendo la especie para conocer si es diferible
            var especiesCiclo = await _context.EspecieCiclo
                .Include(ec => ec.IdEspecieNavigation)
                .Where(ec => ec.IdCiclo == cicloActivo.IdCiclo)
                .ToListAsync(cancellationToken);

            // 7. Crear Créditos por cada EspecieCiclo
            foreach (var especieCiclo in especiesCiclo)
            {
                var existeCredito = await _context.Credito
                    .AnyAsync(c => c.IdMatricula == matricula.IdMatricula
                                && c.IdEspecieCiclo == especieCiclo.IdEspecieCiclo, cancellationToken);

                if (!existeCredito)
                {
                    var especie = especieCiclo.IdEspecieNavigation;
                    var esDiferible = especie?.EsDiferible ?? false;
                    var valorEspecie = especieCiclo.ValorEspecie;

                    // Crear el crédito
                    var credito = new Credito
                    {
                        IdMatricula = matricula.IdMatricula,
                        IdEspecieCiclo = especieCiclo.IdEspecieCiclo,
                        MontoOriginal = valorEspecie,
                        MontoBeneficio = null,
                        MontoFinal = valorEspecie,
                        SaldoPendiente = esDiferible ? 0 : valorEspecie,
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
                    credito.SaldoPendiente = esDiferible ? 0 : credito.MontoFinal.Value;

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
            FechaAplicacion = DateTime.Now
        }).ToList();

        await _context.CreditoBeneficio.AddRangeAsync(registros, cancellationToken);
        // El SaveChanges se hará afuera o aquí si se prefiere
        await _context.SaveChangesAsync(cancellationToken);

        return montoBeneficio;
    }
}