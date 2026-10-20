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
                .Include(d => d.IdParaleloNavigation)
                    .ThenInclude(p => p.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .FirstOrDefaultAsync(d => d.IdDistributivo == id, ct);
        }

        public async Task<IEnumerable<Distributivo>> GetAllAsync(CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdTipoOfertaNavigation)
                .Include(d => d.IdParaleloNavigation)
                    .ThenInclude(p => p.Matricula)
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
                .Include(d => d.IdParaleloNavigation)
                    .ThenInclude(p => p.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdPersona == idPersona)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByParaleloAsync(int idParalelo, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdTipoOfertaNavigation)
                .Include(d => d.IdParaleloNavigation)
                    .ThenInclude(p => p.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdParalelo == idParalelo)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByDetalleMallaAsync(int idDetalleMalla, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdParaleloNavigation)
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
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation) 
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdTipoOfertaNavigation)
                .Include(d => d.IdParaleloNavigation) 
                    .ThenInclude(p => p.Matricula)     
                .Include(d => d.IdPersonaNavigation)   
                    .ThenInclude(u => u.IdPersonaNavigation) 
                .Where(d => d.IdDetalleMallaNavigation.IdMallaNavigation.IdCiclo == idCiclo)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByMallaPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdTipoOfertaNavigation)
                .Include(d => d.IdParaleloNavigation)
                    .ThenInclude(p => p.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdDetalleMallaNavigation.IdMalla == idMalla)
                .OrderBy(d => d.IdDistributivo)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);
        }

        public async Task<int> CountByMallaAsync(int idMalla, CancellationToken ct)
        {
            return await _context.Distributivo
                .AsNoTracking()
                .CountAsync(d => d.IdDetalleMallaNavigation.IdMalla == idMalla, ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByCicloPagedAsync(int idCiclo, int pageNumber, int pageSize, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdTipoOfertaNavigation)
                .Include(d => d.IdParaleloNavigation)
                    .ThenInclude(p => p.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdDetalleMallaNavigation.IdMallaNavigation.IdCiclo == idCiclo)
                .OrderBy(d => d.IdDistributivo)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);
        }

        public async Task<int> CountByCicloAsync(int idCiclo, CancellationToken ct)
        {
            return await _context.Distributivo
                .AsNoTracking()
                .CountAsync(d => d.IdDetalleMallaNavigation.IdMallaNavigation.IdCiclo == idCiclo, ct);
        }

        public async Task<IEnumerable<Distributivo>> GetAllWithDetailsAsync(CancellationToken ct)
        {
            // Same as GetAllAsync but explicitly "WithDetails" if standard GetAll becomes lighter later.
            // For now, reuse the heavy logic.
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdCicloNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                        .ThenInclude(m => m.IdTipoOfertaNavigation)
                .Include(d => d.IdParaleloNavigation)
                    .ThenInclude(p => p.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Distributivo>> GetByDocenteWithDetailsAsync(int idPersona, CancellationToken ct)
        {
            return await _context.Distributivo
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                            .ThenInclude(m => m.IdCicloNavigation)
                .Include(d => d.IdParaleloNavigation)
                    .ThenInclude(p => p.Matricula)
                .Include(d => d.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Where(d => d.IdPersona == idPersona)
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
                .Where(d => d.IdDetalleMallaNavigation.IdMalla == idMalla)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMateriaNavigation)
                .Include(d => d.IdDetalleMallaNavigation)
                    .ThenInclude(dm => dm.IdMallaNavigation)
                .Include(d => d.IdParaleloNavigation)
                    .ThenInclude(p => p.Matricula)
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
                .Include(dm => dm.IdMallaNavigation)
                    .ThenInclude(m => m.IdTipoOfertaNavigation)
                .Include(dm => dm.Distributivo)
                    .ThenInclude(d => d.IdParaleloNavigation)
                        .ThenInclude(p => p.Matricula)
                .Include(dm => dm.Distributivo)
                    .ThenInclude(d => d.IdPersonaNavigation)
                        .ThenInclude(u => u.IdPersonaNavigation)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<bool> ExisteAsignacionAsync(int idDetalleMalla, int idParalelo, int? idExcluir, CancellationToken ct)
        {
            var query = _context.Distributivo
                .Where(d => d.IdDetalleMalla == idDetalleMalla && d.IdParalelo == idParalelo);

            if (idExcluir.HasValue)
            {
                query = query.Where(d => d.IdDistributivo != idExcluir.Value);
            }

            return await query.AnyAsync(ct);
        }

        public async Task<bool> ExisteAsignacionDocenteAsync(int idDetalleMalla, int idParalelo, int idPersona, CancellationToken ct)
        {
            return await _context.Distributivo
                .AnyAsync(d => d.IdDetalleMalla == idDetalleMalla
                            && d.IdParalelo == idParalelo
                            && d.IdPersona == idPersona, ct);
        }

        public async Task<int> ContarAlumnosPorParaleloAsync(int idParalelo, CancellationToken ct)
        {
            return await _context.Matricula
                .CountAsync(m => m.IdParalelo == idParalelo, ct);
        }

        public async Task<int> ContarAsignacionesPorDocenteAsync(int idPersona, CancellationToken ct)
        {
            return await _context.Distributivo
                .CountAsync(d => d.IdPersona == idPersona, ct);
        }

        public async Task<IEnumerable<(int IdPersona, string NombreCompleto, string Documento, int AsignacionesActuales)>> GetDocentesDisponiblesAsync(CancellationToken ct)
        {
            // Obtener usuarios con rol PROFESOR (IdRol = 3)
            var docentes = await _context.RolUsuario
                .Where(ru => ru.IdRol == 3) // 3 = PROFESOR
                .Include(ru => ru.IdPersonaNavigation)
                    .ThenInclude(u => u.IdPersonaNavigation)
                .Select(ru => new
                {
                    ru.IdPersona,
                    Persona = ru.IdPersonaNavigation.IdPersonaNavigation
                })
                .ToListAsync(ct);

            var result = new List<(int IdPersona, string NombreCompleto, string Documento, int AsignacionesActuales)>();

            foreach (var d in docentes)
            {
                var asignaciones = await _context.Distributivo.CountAsync(dist => dist.IdPersona == d.IdPersona, ct);
                var nombreCompleto = d.Persona != null
                    ? $"{d.Persona.PrimerNombre} {d.Persona.SegundoNombre} {d.Persona.PrimerApellido} {d.Persona.SegundoApellido}".Trim()
                    : string.Empty;
                var documento = d.Persona?.Documento ?? string.Empty;

                result.Add((d.IdPersona, nombreCompleto, documento, asignaciones));
            }

            return result;
        }
    }
}
