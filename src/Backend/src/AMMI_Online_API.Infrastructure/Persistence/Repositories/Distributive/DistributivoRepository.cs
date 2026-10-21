using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Distributive;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Distributive
{
    public class DistributivoRepository : IDistributivoRepository
    {
        private readonly Ammi_OnlineContext _context;

        public DistributivoRepository(Ammi_OnlineContext context)
        {
            _context = context;
        }

        public async Task<Distributivo?> GetByIdAsync(int id, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdPlantillaEvaluacionNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .FirstOrDefaultAsync(d => d.IdDistributivo == id, ct);
        }

        public async Task<IEnumerable<Distributivo>> GetAllAsync(CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByDocenteAsync(int idPersona, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdPlantillaEvaluacionNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdPersona == idPersona && d.Activo == true)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByMallaParaleloAsync(int idMallaParalelo, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdMallaParalelo == idMallaParalelo)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByDetalleMallaAsync(int idDetalleMalla, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdMallaParaleloNavigation)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdDetalleMalla == idDetalleMalla)
                .ToListAsync(ct);
        }

        public async Task<Distributivo> AddAsync(Distributivo entity, CancellationToken ct)
        {
            await _context.Distributivo.AddAsync(entity, ct);
            await _context.SaveChangesAsync(ct);
            return entity;
        }

        public async Task UpdateAsync(Distributivo entity, CancellationToken ct)
        {
            _context.Distributivo.Update(entity);
            await _context.SaveChangesAsync(ct);
        }

        public async Task DeleteAsync(int id, CancellationToken ct)
        {
            var entity = await GetByIdAsync(id, ct);
            if (entity != null)
            {
                _context.Distributivo.Remove(entity);
                await _context.SaveChangesAsync(ct);
            }
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken ct)
        {
            return await _context.Distributivo.AnyAsync(d => d.IdDistributivo == id, ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByMallaAsync(int idMalla, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                .Where(d => d.IdDetalleMallaNavigation.IdMalla == idMalla)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByCicloAsync(int idCiclo, CancellationToken ct)
        {
            var distributivosExistentes = await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdParaleloNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdMallaParaleloNavigation.IdMallaNavigation.IdCiclo == idCiclo)
                .ToListAsync(ct);

            var mallaParalelos = await _context.MallaParalelo
                .Include(mp => mp.IdParaleloNavigation)
                .Include(mp => mp.IdMallaNavigation)
                    .ThenInclude(m => m.IdCicloNavigation)
                        .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(mp => mp.Matricula)
                .Where(mp => mp.IdMallaNavigation.IdCiclo == idCiclo && mp.EsActivo)
                .ToListAsync(ct);

            var detallesMalla = await _context.DetalleMalla
                .Include(dm => dm.IdMateriaNavigation)
                .Include(dm => dm.IdMallaNavigation)
                    .ThenInclude(m => m.IdCicloNavigation)
                        .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Where(dm => dm.IdMallaNavigation.IdCiclo == idCiclo)
                .ToListAsync(ct);

            var result = new List<Distributivo>(distributivosExistentes);

            var existingKeys = new HashSet<string>(
                distributivosExistentes.Select(d => $"{d.IdDetalleMalla}_{d.IdMallaParalelo}")
            );

            foreach (var mp in mallaParalelos)
            {
                var idMalla = mp.IdMalla;
                var materiasDeMalla = detallesMalla.Where(dm => dm.IdMalla == idMalla);

                foreach (var dm in materiasDeMalla)
                {
                    var key = $"{dm.IdDetalleMalla}_{mp.IdMallaParalelo}";
                    if (!existingKeys.Contains(key))
                    {
                        result.Add(new Distributivo
                        {
                            IdDistributivo = 0,
                            IdMallaParalelo = mp.IdMallaParalelo,
                            IdMallaParaleloNavigation = mp,
                            IdDetalleMalla = dm.IdDetalleMalla,
                            IdDetalleMallaNavigation = dm,
                            IdPersona = null,
                            IdPersonaNavigation = null,
                            Activo = true
                        });
                        existingKeys.Add(key);
                    }
                }
            }

            return result;
        }

        public async Task<IEnumerable<Distributivo>> GetByMallaPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdMallaParaleloNavigation.IdMalla == idMalla)
                .OrderBy(d => d.IdDistributivo)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);
        }

        public async Task<int> CountByMallaAsync(int idMalla, CancellationToken ct)
        {
            return await _context.Distributivo
                .AsNoTracking()
                .CountAsync(d => d.IdMallaParaleloNavigation.IdMalla == idMalla, ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByCicloPagedAsync(int idCiclo, int pageNumber, int pageSize, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdMallaParaleloNavigation.IdMallaNavigation.IdCiclo == idCiclo)
                .OrderBy(d => d.IdDistributivo)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);
        }

        public async Task<int> CountByCicloAsync(int idCiclo, CancellationToken ct)
        {
            return await _context.Distributivo
                .AsNoTracking()
                .CountAsync(d => d.IdMallaParaleloNavigation.IdMallaNavigation.IdCiclo == idCiclo, ct);
        }

        public async Task<IEnumerable<Distributivo>> GetAllWithDetailsAsync(CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByDocenteWithDetailsAsync(int idPersona, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                            .ThenInclude(m => m.IdCicloNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdPersona == idPersona && d.Activo == true)
                .ToListAsync(ct);
        }

        public async Task AddRangeAsync(IEnumerable<Distributivo> entities, CancellationToken ct)
        {
            await _context.Distributivo.AddRangeAsync(entities, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByMallaWithDetailsAsync(int idMalla, CancellationToken ct)
        {
            return await _context.Distributivo
                .Where(d => d.IdMallaParaleloNavigation.IdMalla == idMalla)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .ToListAsync(ct);
        }

        // Retorna todos los DetalleMalla de una Malla, incluyendo sus Distributivos (si existen).
        // Permite detectar materias sin docente asignado (Distributivo vacío).
        public async Task<IEnumerable<DetalleMalla>> GetDetalleMallaByMallaAsync(int idMalla, CancellationToken ct)
        {
            return await _context.DetalleMalla
                .Where(dm => dm.IdMalla == idMalla)
                .Include(dm => dm.IdMateriaNavigation)
                .Include(dm => dm.IdMallaNavigation)
                    .ThenInclude(m => m.IdCicloNavigation)
                        .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(dm => dm.Distributivo)
                    .ThenInclude(d => d.IdMallaParaleloNavigation)
                        .ThenInclude(mp => mp.Matricula)
                .Include(dm => dm.Distributivo)
                    .ThenInclude(d => d.IdPersonaNavigation)
                        .ThenInclude(u => u.IdPersonaNavigation)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<bool> ExisteAsignacionAsync(int idDetalleMalla, int idMallaParalelo, int? idExcluir, CancellationToken ct)
        {
            var query = _context.Distributivo
                .Where(d => d.IdDetalleMalla == idDetalleMalla && d.IdMallaParalelo == idMallaParalelo && d.Activo == true);

            if (idExcluir.HasValue)
            {
                query = query.Where(d => d.IdDistributivo != idExcluir.Value);
            }

            return await query.AnyAsync(ct);
        }

        public async Task<bool> ExisteAsignacionDocenteAsync(int idDetalleMalla, int idMallaParalelo, int idPersona, CancellationToken ct)
        {
            return await _context.Distributivo
                .AnyAsync(d => d.IdDetalleMalla == idDetalleMalla
                            && d.IdMallaParalelo == idMallaParalelo
                            && d.IdPersona == idPersona
                            && d.Activo == true, ct);
        }

        public async Task<int> ContarAlumnosPorMallaParaleloAsync(int idMallaParalelo, CancellationToken ct)
        {
            return await _context.Matricula
                .CountAsync(m => m.IdMallaParalelo == idMallaParalelo, ct);
        }

        public async Task<IEnumerable<Distributivo>> GetActivosByMallaParaleloAsync(int idMallaParalelo, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                .Include(d => d.IdPersonaNavigation)
                .Where(d => d.IdMallaParalelo == idMallaParalelo && d.Activo == true)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetSlotsSinDocenteByMallaAsync(int idMalla, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                .Where(d => d.IdMallaParaleloNavigation.IdMalla == idMalla && d.IdPersona == null && d.Activo == true)
                .ToListAsync(ct);
        }

        public async Task ClonarDistributivosAsync(int idOrigen, int idDestino, CancellationToken ct)
        {
            var origen = await GetActivosByMallaParaleloAsync(idOrigen, ct);
            var nuevos = origen.Select(d => new Distributivo
            {
                IdDetalleMalla = d.IdDetalleMalla,
                IdMallaParalelo = idDestino,
                IdPersona = d.IdPersona,
                Activo = true
            }).ToList();

            await AddRangeAsync(nuevos, ct);
        }

        public async Task DesactivarAsync(int idDistributivo, CancellationToken ct)
        {
            var entity = await _context.Distributivo.FindAsync(new object[] { idDistributivo }, ct);
            if (entity != null)
            {
                entity.Activo = false;
                await _context.SaveChangesAsync(ct);
            }
        }

        public async Task<bool> TieneNotasAsync(int idDetalleMalla, int idMallaParalelo, CancellationToken ct)
        {
            // Verifica si existen notas registradas para esta materia en este paralelo específico
            return await _context.DetalleMatricula
                .AnyAsync(dm => dm.IdDetalleMalla == idDetalleMalla 
                             && dm.IdMatriculaNavigation.IdMallaParalelo == idMallaParalelo
                             && (dm.NotaFinal != null || dm.NotasAlumno.Any()), ct);
        }

        public async Task<int> ContarAsignacionesPorDocenteAsync(int idPersona, CancellationToken ct)
        {
            return await _context.Distributivo
                .CountAsync(d => d.IdPersona == idPersona, ct);
        }

        public async Task<IEnumerable<(int IdPersona, string NombreCompleto, string Documento, int AsignacionesActuales, decimal TotalHoras, int TotalParalelos, int TotalAlumnos)>> GetDocentesDisponiblesAsync(CancellationToken ct)
        {
            var docentes = await _context.RolUsuario
                .Where(ru => ru.IdRol == 3)
                .Include(ru => ru.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Select(ru => new
                {
                    ru.IdPersona,
                    Persona = ru.IdPersonaNavigation.IdPersonaNavigation
                })
                .ToListAsync(ct);

            var result = new List<(int IdPersona, string NombreCompleto, string Documento, int AsignacionesActuales, decimal TotalHoras, int TotalParalelos, int TotalAlumnos)>();

            foreach (var d in docentes)
            {
                var asignaciones = await _context.Distributivo
                    .Include(dist => dist.IdDetalleMallaNavigation)
                        .ThenInclude(dm => dm.IdMateriaNavigation)
                    .Include(dist => dist.IdMallaParaleloNavigation)
                        .ThenInclude(mp => mp.Matricula)
                    .Where(dist => dist.IdPersona == d.IdPersona && dist.Activo == true)
                    .ToListAsync(ct);

                var nombreCompleto = d.Persona != null
                    ? $"{d.Persona.PrimerNombre} {d.Persona.SegundoNombre} {d.Persona.PrimerApellido} {d.Persona.SegundoApellido}".Trim()
                    : string.Empty;
                var documento = d.Persona?.Documento ?? string.Empty;
                var totalHoras = asignaciones.Sum(a => a.IdDetalleMallaNavigation?.IdMateriaNavigation?.HorasRequeridas ?? 0);
                var totalParalelos = asignaciones.Select(a => a.IdMallaParalelo).Distinct().Count();
                var totalAlumnos = asignaciones
                    .GroupBy(a => a.IdMallaParalelo)
                    .Sum(g => g.First().IdMallaParaleloNavigation?.Matricula?.Count ?? 0);

                result.Add((d.IdPersona, nombreCompleto, documento, asignaciones.Count, totalHoras, totalParalelos, totalAlumnos));
            }

            return result;
        }

        public async Task<IEnumerable<Distributivo>> GetFiltradoPagedAsync(
            int? idMalla, int? idMallaParalelo, int? idDetalleMalla, bool? soloActivos,
            int pageNumber, int pageSize, CancellationToken ct)
        {
            var query = _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdParaleloNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .AsQueryable();

            if (idMalla.HasValue)
                query = query.Where(d => d.IdMallaParaleloNavigation.IdMalla == idMalla.Value);
            if (idMallaParalelo.HasValue)
                query = query.Where(d => d.IdMallaParalelo == idMallaParalelo.Value);
            if (idDetalleMalla.HasValue)
                query = query.Where(d => d.IdDetalleMalla == idDetalleMalla.Value);
            if (soloActivos.HasValue)
                query = query.Where(d => d.Activo == soloActivos.Value);

            return await query
                .OrderBy(d => d.IdDistributivo)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);
        }

        public async Task<int> CountFiltradoAsync(
            int? idMalla, int? idMallaParalelo, int? idDetalleMalla, bool? soloActivos, CancellationToken ct)
        {
            var query = _context.Distributivo.AsNoTracking().AsQueryable();

            if (idMalla.HasValue)
                query = query.Where(d => d.IdMallaParaleloNavigation.IdMalla == idMalla.Value);
            if (idMallaParalelo.HasValue)
                query = query.Where(d => d.IdMallaParalelo == idMallaParalelo.Value);
            if (idDetalleMalla.HasValue)
                query = query.Where(d => d.IdDetalleMalla == idDetalleMalla.Value);
            if (soloActivos.HasValue)
                query = query.Where(d => d.Activo == soloActivos.Value);

            return await query.CountAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByDocenteByDocumentoAsync(string documento, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdPersonaNavigation.IdPersonaNavigation.Documento == documento && d.Activo == true)
                .ToListAsync(ct);
        }

        public async Task<Distributivo?> GetByIdConAlumnosAsync(int id, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdPlantillaEvaluacionNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdParaleloNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                            .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                        .ThenInclude(m => m.IdUsuarioAlumnoNavigation)
                            .ThenInclude(u => u.IdPersonaNavigation)
                .Include(d => d.IdMallaParaleloNavigation)
                    .ThenInclude(mp => mp.Matricula)
                        .ThenInclude(m => m.IdEstadoMatriculaNavigation)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .FirstOrDefaultAsync(d => d.IdDistributivo == id, ct);
        }

        public async Task<IEnumerable<MallaParalelo>> GetMallaParalelosByCicloAsync(int idCiclo, CancellationToken ct)
        {
            return await _context.MallaParalelo
                .Include(mp => mp.IdParaleloNavigation)
                .Include(mp => mp.IdMallaNavigation)
                    .ThenInclude(m => m.IdCicloNavigation)
                        .ThenInclude(c => c.IdTipoOfertaNavigation)
                .Include(mp => mp.Matricula)
                .Include(mp => mp.Distributivo)
                    .ThenInclude(d => d.IdDetalleMallaNavigation)
                        .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(mp => mp.Distributivo)
                    .ThenInclude(d => d.IdPersonaNavigation)
                        .ThenInclude(u => u.IdPersonaNavigation)
                .Where(mp => mp.IdMallaNavigation.IdCiclo == idCiclo)
                .OrderBy(mp => mp.IdMallaParalelo)
                .ToListAsync(ct);
        }
    }
}
