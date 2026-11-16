using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Infrastructure;

public class DetalleMallaRepository : IDetalleMallaRepository
{
    private readonly Ammi_OnlineContext _context;

    public DetalleMallaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<DetalleMalla?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .Include(dm => dm.IdMateriaNavigation)
            .Include(dm => dm.IdPlantillaEvaluacionNavigation)
            .Include(dm => dm.IdAreaCompetenciaNavigation)
            .Include(dm => dm.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
            .FirstOrDefaultAsync(dm => dm.IdDetalleMalla == id, cancellationToken);
    }

    public async Task<IEnumerable<DetalleMalla>> GetByMallaIdAsync(int idMalla, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .Where(dm => dm.IdMalla == idMalla)
            .Include(dm => dm.IdMateriaNavigation)
            .Include(dm => dm.IdPlantillaEvaluacionNavigation)
            .Include(dm => dm.IdAreaCompetenciaNavigation)
            .Include(dm => dm.IdMallaNavigation)
                .ThenInclude(m => m.MallaParalelo)
                    .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(dm => dm.IdMallaNavigation)
                .ThenInclude(m => m.MallaParalelo)
                    .ThenInclude(mp => mp.Matricula)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DetalleMalla>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .Include(dm => dm.IdMateriaNavigation)
            .Include(dm => dm.IdPlantillaEvaluacionNavigation)
            .Include(dm => dm.IdAreaCompetenciaNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DetalleMalla>> GetByMallaIdPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .Where(dm => dm.IdMalla == idMalla)
            .Include(dm => dm.IdMateriaNavigation)
            .Include(dm => dm.IdPlantillaEvaluacionNavigation)
            .Include(dm => dm.IdAreaCompetenciaNavigation)
            .Include(dm => dm.IdMallaNavigation)
                .ThenInclude(m => m.MallaParalelo)
                    .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(dm => dm.IdMallaNavigation)
                .ThenInclude(m => m.MallaParalelo)
                    .ThenInclude(mp => mp.Matricula)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdParaleloNavigation)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
            .Include(dm => dm.Distributivo)
                .ThenInclude(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
            .OrderBy(dm => dm.IdDetalleMalla)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountByMallaIdAsync(int idMalla, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .AsNoTracking()
            .CountAsync(dm => dm.IdMalla == idMalla, cancellationToken);
    }

    public async Task<DetalleMalla> AddAsync(DetalleMalla detalleMalla, CancellationToken cancellationToken)
    {
        _context.DetalleMalla.Add(detalleMalla);
        await _context.SaveChangesAsync(cancellationToken);
        return detalleMalla;
    }

    public async Task<IEnumerable<DetalleMalla>> AddRangeAsync(IEnumerable<DetalleMalla> detallesMalla, CancellationToken cancellationToken)
    {
        var list = detallesMalla.ToList();
        _context.DetalleMalla.AddRange(list);
        await _context.SaveChangesAsync(cancellationToken);
        return list;
    }

    public async Task<DetalleMalla> UpdateAsync(DetalleMalla detalleMalla, CancellationToken cancellationToken)
    {
        _context.Entry(detalleMalla).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);
        return detalleMalla;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.DetalleMalla.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
            return false;

        _context.DetalleMalla.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla.AnyAsync(dm => dm.IdDetalleMalla == id, cancellationToken);
    }

    public async Task<bool> ExistsMateriaInMallaAsync(int idMalla, int idMateria, CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .AnyAsync(dm => dm.IdMalla == idMalla && dm.IdMateria == idMateria, cancellationToken);
    }

    public async Task<bool> TieneNotasAsync(int idDetalleMalla, CancellationToken cancellationToken)
    {
        return await _context.DetalleMatricula
            .Where(dm => dm.IdDetalleMalla == idDetalleMalla)
            .AnyAsync(dm => dm.NotaFinal != null || dm.NotasAlumno.Any(), cancellationToken);
    }

    public async Task<(DateOnly? FechaInicio, DateOnly? FechaFin)> GetFechasSugeridasModuloAsync(int idCiclo, int modulo, CancellationToken cancellationToken)
    {
        // 1. Obtener Periodo de Referencia del ciclo actual
        var cicloActual = await _context.Ciclo
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdCiclo == idCiclo, cancellationToken);

        if (cicloActual == null) return (null, null);

        // 2. Buscar en cualquier otra malla configurada dentro del MISMO Periodo para ese número de Módulo
        var query = _context.DetalleMalla
            .AsNoTracking()
            .Where(dm => dm.IdMallaNavigation.IdCicloNavigation.IdPeriodo == cicloActual.IdPeriodo
                         && dm.Modulo == modulo
                         && (dm.FechaInicio != null || dm.FechaFin != null));

        var match = await query
            .Select(dm => new
            {
                dm.FechaInicio,
                dm.FechaFin
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (match != null)
        {
            return (match.FechaInicio, match.FechaFin);
        }

        return (null, null);
    }

    public async Task<int> MigrarPlantillaMateriaAsync(int idDetalleMalla, int nuevaPlantillaId, CancellationToken cancellationToken)
    {
        var detalleMalla = await _context.DetalleMalla
            .FirstOrDefaultAsync(dm => dm.IdDetalleMalla == idDetalleMalla, cancellationToken);
        if (detalleMalla == null) throw new KeyNotFoundException("DetalleMalla no encontrado");

        var plantillaViejaId = detalleMalla.IdPlantillaEvaluacion;
        if (plantillaViejaId == nuevaPlantillaId) return 0;

        // Obtener nodos de plantilla vieja y nueva
        var estructuraVieja = await _context.PlantillaEstructura
            .Where(p => p.IdPlantillaEvaluacion == plantillaViejaId)
            .OrderBy(p => p.Orden)
            .ToListAsync(cancellationToken);

        var estructuraNueva = await _context.PlantillaEstructura
            .Where(p => p.IdPlantillaEvaluacion == nuevaPlantillaId)
            .OrderBy(p => p.Orden)
            .ToListAsync(cancellationToken);

        // Nodos hojas
        var hojasViejas = estructuraVieja
            .Where(p => !estructuraVieja.Any(h => h.IdNodoPadre == p.IdPlantillaEstructura))
            .ToList();

        var hojasNuevas = estructuraNueva
            .Where(p => !estructuraNueva.Any(h => h.IdNodoPadre == p.IdPlantillaEstructura))
            .ToList();

        // Tareas y evaluaciones
        var tareasViejas = hojasViejas.Where(h => h.NodoNombre.StartsWith("Tarea", StringComparison.OrdinalIgnoreCase)).OrderBy(h => h.Orden).ToList();
        var evalVieja = hojasViejas.FirstOrDefault(h => !h.NodoNombre.StartsWith("Tarea", StringComparison.OrdinalIgnoreCase));

        var tareasNuevas = hojasNuevas.Where(h => h.NodoNombre.StartsWith("Tarea", StringComparison.OrdinalIgnoreCase)).OrderBy(h => h.Orden).ToList();
        var evalNueva = hojasNuevas.FirstOrDefault(h => !h.NodoNombre.StartsWith("Tarea", StringComparison.OrdinalIgnoreCase));

        var mapeoNodos = new Dictionary<int, int>();
        var nodosAEliminar = new List<int>();

        int minTareas = Math.Min(tareasViejas.Count, tareasNuevas.Count);
        for (int i = 0; i < minTareas; i++)
        {
            mapeoNodos[tareasViejas[i].IdPlantillaEstructura] = tareasNuevas[i].IdPlantillaEstructura;
        }

        if (tareasViejas.Count > tareasNuevas.Count)
        {
            for (int i = minTareas; i < tareasViejas.Count; i++)
            {
                nodosAEliminar.Add(tareasViejas[i].IdPlantillaEstructura);
            }
        }

        if (evalVieja != null && evalNueva != null)
        {
            mapeoNodos[evalVieja.IdPlantillaEstructura] = evalNueva.IdPlantillaEstructura;
        }

        // Nodos compuestos viejos (Promedios calculados)
        var nodosCompuestosViejos = estructuraVieja
            .Where(p => estructuraVieja.Any(h => h.IdNodoPadre == p.IdPlantillaEstructura))
            .Select(p => p.IdPlantillaEstructura)
            .ToList();

        var detallesMatricula = await _context.DetalleMatricula
            .Where(dm => dm.IdDetalleMalla == idDetalleMalla)
            .ToListAsync(cancellationToken);

        var detallesMatriculaIds = detallesMatricula.Select(dm => dm.IdDetalleMatricula).ToList();
        int notasEliminadas = 0;

        if (detallesMatriculaIds.Any())
        {
            // 1. Eliminar notas de tareas sobrantes (ej. Tarea 8 al pasar de 8 a 7)
            if (nodosAEliminar.Any())
            {
                var notasSobrantes = await _context.NotasAlumno
                    .Where(n => detallesMatriculaIds.Contains(n.IdDetaleMatricula) && nodosAEliminar.Contains(n.IdPlantillaEstructura))
                    .ToListAsync(cancellationToken);
                notasEliminadas = notasSobrantes.Count;
                _context.NotasAlumno.RemoveRange(notasSobrantes);
            }

            // 2. Eliminar notas de nodos calculados de la estructura vieja
            if (nodosCompuestosViejos.Any())
            {
                var notasCalculadasViejas = await _context.NotasAlumno
                    .Where(n => detallesMatriculaIds.Contains(n.IdDetaleMatricula) && nodosCompuestosViejos.Contains(n.IdPlantillaEstructura))
                    .ToListAsync(cancellationToken);
                _context.NotasAlumno.RemoveRange(notasCalculadasViejas);
            }

            // 3. Migrar las notas coincidentes
            foreach (var kvp in mapeoNodos)
            {
                var idViejo = kvp.Key;
                var idNuevo = kvp.Value;

                var notasAMigrar = await _context.NotasAlumno
                    .Where(n => detallesMatriculaIds.Contains(n.IdDetaleMatricula) && n.IdPlantillaEstructura == idViejo)
                    .ToListAsync(cancellationToken);

                foreach (var n in notasAMigrar)
                {
                    n.IdPlantillaEstructura = idNuevo;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        // 4. Actualizar DetalleMalla
        detalleMalla.IdPlantillaEvaluacion = nuevaPlantillaId;
        _context.DetalleMalla.Update(detalleMalla);
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Recalcular notas compuestas para cada DetalleMatricula con la nueva estructura
        var tareasPadreNueva = estructuraNueva.FirstOrDefault(p => p.NodoNombre.Contains("Tareas") && estructuraNueva.Any(h => h.IdNodoPadre == p.IdPlantillaEstructura));
        var raizNueva = estructuraNueva.FirstOrDefault(p => p.IdNodoPadre == null);

        if (tareasPadreNueva != null && raizNueva != null && detallesMatricula.Any())
        {
            foreach (var dm in detallesMatricula)
            {
                var notasHojas = await _context.NotasAlumno
                    .Where(n => n.IdDetaleMatricula == dm.IdDetalleMatricula && hojasNuevas.Select(h => h.IdPlantillaEstructura).Contains(n.IdPlantillaEstructura))
                    .ToListAsync(cancellationToken);

                // Promedio de tareas
                var notasDeTareas = notasHojas
                    .Where(n => tareasNuevas.Select(t => t.IdPlantillaEstructura).Contains(n.IdPlantillaEstructura))
                    .ToList();

                decimal? promTareas = null;
                var notasConValor = notasDeTareas.Where(n => n.ValorNota.HasValue).ToList();
                if (notasConValor.Any())
                {
                    promTareas = Math.Round(notasConValor.Average(n => n.ValorNota!.Value), 2);
                    _context.NotasAlumno.Add(new NotasAlumno
                    {
                        IdDetaleMatricula = dm.IdDetalleMatricula,
                        IdPlantillaEstructura = tareasPadreNueva.IdPlantillaEstructura,
                        ValorNota = promTareas.Value,
                        Observacion = "Calculado automaticamente"
                    });
                }

                // Evaluación
                decimal? evalNota = null;
                if (evalNueva != null)
                {
                    evalNota = notasHojas.FirstOrDefault(n => n.IdPlantillaEstructura == evalNueva.IdPlantillaEstructura)?.ValorNota;
                }

                // Promedio Final: (promTareas * 0.70) + (evalNota * 0.30)
                if (promTareas.HasValue)
                {
                    decimal finalCalc = (promTareas.Value * 0.70m) + ((evalNota ?? 0m) * 0.30m);
                    finalCalc = Math.Round(finalCalc, 2);

                    _context.NotasAlumno.Add(new NotasAlumno
                    {
                        IdDetaleMatricula = dm.IdDetalleMatricula,
                        IdPlantillaEstructura = raizNueva.IdPlantillaEstructura,
                        ValorNota = finalCalc,
                        Observacion = "Calculado automaticamente"
                    });

                    dm.NotaFinal = finalCalc;
                    dm.Aprobado = finalCalc >= 7.0m;
                    _context.DetalleMatricula.Update(dm);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        return notasEliminadas;
    }
}


