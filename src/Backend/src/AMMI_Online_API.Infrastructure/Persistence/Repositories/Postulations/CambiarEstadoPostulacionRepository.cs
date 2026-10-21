using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using AMMI_Online_API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Postulations;

public class CambiarEstadoPostulacionRepository : ICambiarEstadoPostulacion
{
    private readonly Ammi_OnlineContext _context;

    public CambiarEstadoPostulacionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Postulacion?> GetPostulacionByIdAsync(
        int idPostulacion,
        CancellationToken cancellationToken)
    {
        return await _context.Postulacion
            .FindAsync(new object[] { idPostulacion }, cancellationToken);
    }

    public async Task<CambiarEstadoResultado> ProcesarCambioEstadoAsync(
        Postulacion postulacion,
        Usuario? nuevoUsuario,
        RolUsuario? rolUsuario,
        int idParalelo,
        CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var resultado = new CambiarEstadoResultado
            {
                UsuarioCreado = false,
                MatriculaCreada = false
            };

            var existingPostulacion = await _context.Postulacion
                .FirstOrDefaultAsync(p => p.IdPostulacion == postulacion.IdPostulacion, cancellationToken);

            if (existingPostulacion == null)
            {
                throw new KeyNotFoundException("Postulación no encontrada.");
            }

            // Guardar datos necesarios antes de modificar
            var idMallaPostulacion = existingPostulacion.IdMalla;
            var idPersonaPostulacion = existingPostulacion.IdPersona;

            // Actualizar estado de la postulación
            existingPostulacion.IdTipoEstadoAprobacion = postulacion.IdTipoEstadoAprobacion;
            existingPostulacion.IdUsuarioEvaluador = postulacion.IdUsuarioEvaluador;
            existingPostulacion.FechaEvaluada = postulacion.FechaEvaluada;
            existingPostulacion.ObservacionesRevision = postulacion.ObservacionesRevision;
            resultado.FilasAfectadas = await _context.SaveChangesAsync(cancellationToken);

            // Crear usuario si es nuevo
            if (nuevoUsuario != null)
            {
                await _context.Usuario.AddAsync(nuevoUsuario, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                resultado.UsuarioCreado = true;
            }

            // Crear rol de usuario (si no existe)
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

            // Si el nuevo estado es APROBADO (asumo IdTipoEstadoAprobacion == 4)
            if (postulacion.IdTipoEstadoAprobacion == 4)
            {
                // 1. Crear Matrícula
                var matricula = new Matricula
                {
                    IdUsuarioAlumno = idPersonaPostulacion,  // Ajusta según tu entidad Matricula
                    IdMallaParalelo = idParalelo
                };

                await _context.Matricula.AddAsync(matricula, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                resultado.MatriculaCreada = true;
                resultado.IdMatricula = matricula.IdMatricula;

                // 2. Crear DetalleMatricula (asociar las materias de la malla)
                var detallesMalla = await _context.DetalleMalla
                    .Where(dm => dm.IdMalla == idMallaPostulacion)
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
                    }
                }
                await _context.SaveChangesAsync(cancellationToken);

                // ============================================
                // GENERACIÓN DE CRÉDITOS
                // ============================================

                // 3. Obtener el ciclo asociado a la malla
                var malla = await _context.Malla
                    .Include(m => m.IdCicloNavigation)
                    .FirstOrDefaultAsync(m => m.IdMalla == idMallaPostulacion, cancellationToken);

                var cicloActivo = malla?.IdCicloNavigation;
                if (cicloActivo == null)
                {
                    throw new InvalidOperationException($"No se encontró ningún ciclo asociado a la Malla ID {idMallaPostulacion}. Verifique la columna 'id_ciclo' en la tabla 'malla'.");
                }

                // 4. Obtener todas las EspecieCiclo de la malla, incluyendo la especie
                var especiesCiclo = await _context.EspecieCiclo
                    .Include(ec => ec.IdEspecieNavigation)
                    .Where(ec => ec.IdMalla == idMallaPostulacion)
                    .ToListAsync(cancellationToken);

                if (!especiesCiclo.Any())
                {
                    // Puede ser válido si el ciclo no tiene especies (ej. beca completa), no se generan créditos
                    // pero se podría registrar un warning o simplemente continuar.
                }

                // 5. Crear Créditos por cada EspecieCiclo
                foreach (var especieCiclo in especiesCiclo)
                {
                    // Verificar si ya existe el crédito para esta matrícula y especie (idempotencia)
                    var existeCredito = await _context.Credito
                        .AnyAsync(c => c.IdMatricula == matricula.IdMatricula
                                    && c.IdEspecieCiclo == especieCiclo.IdEspecieCiclo, cancellationToken);

                    if (!existeCredito)
                    {
                        var especie = especieCiclo.IdEspecieNavigation;
                        var esDiferible = (especie?.EsPension ?? false) && !(especie?.EsMatricula ?? false);

                        // Crear el crédito
                        var credito = new Credito
                        {
                            IdMatricula = matricula.IdMatricula,
                            IdEspecieCiclo = especieCiclo.IdEspecieCiclo,
                            MontoOriginal = especieCiclo.ValorEspecie,
                            MontoBeneficio = null,  // Se asignará después si aplican beneficios
                            MontoFinal = especieCiclo.ValorEspecie, // Inicialmente igual al original
                            SaldoPendiente = especieCiclo.ValorEspecie,
                            // Si es diferible, el saldo pendiente es 0 porque aún no se ha generado la deuda (se generará al diferir)
                            // Si no es diferible, el saldo pendiente es el valor total de la especie
                            Estado = esDiferible ? "PENDIENTE_DIFERIR" : "ACTIVO",
                            FechaGeneracion = DateOnly.FromDateTime(DateTime.Now),
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };

                        await _context.Credito.AddAsync(credito, cancellationToken);
                        await _context.SaveChangesAsync(cancellationToken); // Guardar para obtener IdCredito
                        resultado.CreditosGenerados++;

                        // 6. Si la especie NO es diferible, crear el DetalleCredito (una sola cuota)
                        if (!esDiferible)
                        {
                            var detalleCredito = new DetalleCredito
                            {
                                IdCredito = credito.IdCredito,
                                NumeroCuota = 1,
                                ValorOriginal = especieCiclo.ValorEspecie,
                                SaldoCuota = especieCiclo.ValorEspecie,
                                FechaLimite = null,
                                Estado = "PENDIENTE",
                                Pagado = false
                            };

                            await _context.DetalleCredito.AddAsync(detalleCredito, cancellationToken);
                            await _context.SaveChangesAsync(cancellationToken);
                            resultado.DetallesCreditoGenerados++;
                        }
                        // Especie diferible: no se crea detalle aún; se generará cuando se solicite el diferimiento.
                    }
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

    public async Task<bool> ExisteMatriculaParaUsuarioAsync(
        int idPersona, // Cambiado de idUsuarioAlumno a idPersona para consistencia
        CancellationToken cancellationToken)
    {
        return await _context.Matricula
            .AnyAsync(m => m.IdUsuarioAlumno == idPersona, cancellationToken);
    }

    public async Task<bool> ExisteUsuarioAsync(
        string username,
        CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .AnyAsync(u => u.Username == username, cancellationToken);
    }

    public async Task EliminarRolUsuarioAsync(
        int idPersona,
        int idRol,
        CancellationToken cancellationToken)
    {
        var rolUsuario = await _context.RolUsuario
            .FirstOrDefaultAsync(ru => ru.IdPersona == idPersona && ru.IdRol == idRol, cancellationToken);

        if (rolUsuario != null)
        {
            _context.RolUsuario.Remove(rolUsuario);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<bool> ExisteUsuarioPorIdPersonaAsync(
        int idPersona,
        CancellationToken cancellationToken)
    {
        return await _context.Usuario
            .AnyAsync(u => u.IdPersona == idPersona, cancellationToken);
    }

    public async Task<int> ActualizarEstadoPostulacionAsync(
        Postulacion postulacion,
        CancellationToken cancellationToken)
    {
        var existingPostulacion = await _context.Postulacion
            .FirstOrDefaultAsync(p => p.IdPostulacion == postulacion.IdPostulacion, cancellationToken);

        if (existingPostulacion == null)
        {
            throw new KeyNotFoundException("Postulación no encontrada.");
        }

        existingPostulacion.IdTipoEstadoAprobacion = postulacion.IdTipoEstadoAprobacion;
        existingPostulacion.IdUsuarioEvaluador = postulacion.IdUsuarioEvaluador;
        existingPostulacion.FechaEvaluada = postulacion.FechaEvaluada;
        existingPostulacion.ObservacionesRevision = postulacion.ObservacionesRevision;

        return await _context.SaveChangesAsync(cancellationToken);
    }
}