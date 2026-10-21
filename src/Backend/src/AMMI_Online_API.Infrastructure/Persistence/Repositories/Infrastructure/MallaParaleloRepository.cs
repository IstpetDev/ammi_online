using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Infrastructure
{
    public class MallaParaleloRepository : IMallaParaleloRepository
    {
        private readonly Ammi_OnlineContext _context;

        public MallaParaleloRepository(Ammi_OnlineContext context)
        {
            _context = context;
        }

        public async Task<MallaParalelo?> GetByIdAsync(int id, CancellationToken ct)
        {
            return await _context.MallaParalelo
                .Include(mp => mp.IdParaleloNavigation)
                .Include(mp => mp.IdMallaNavigation)
                .FirstOrDefaultAsync(mp => mp.IdMallaParalelo == id, ct);
        }

        public async Task<IEnumerable<MallaParalelo>> GetByMallaAsync(int idMalla, CancellationToken ct)
        {
            return await _context.MallaParalelo
                .Include(mp => mp.IdParaleloNavigation)
                .Include(mp => mp.Matricula)
                .Where(mp => mp.IdMalla == idMalla)
                .ToListAsync(ct);
        }

        public async Task UpdateAsync(MallaParalelo entity, CancellationToken ct)
        {
            _context.MallaParalelo.Update(entity);
            await _context.SaveChangesAsync(ct);
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken ct)
        {
            return await _context.MallaParalelo.AnyAsync(mp => mp.IdMallaParalelo == id, ct);
        }

        public async Task<int> CountActivosByMallaAsync(int idMalla, CancellationToken ct)
        {
            return await _context.MallaParalelo
                .CountAsync(mp => mp.IdMalla == idMalla && mp.EsActivo, ct);
        }

        public async Task<bool> TieneAlumnosActivosAsync(int idMallaParalelo, CancellationToken ct)
        {
            return await _context.Matricula
                .AnyAsync(m => m.IdMallaParalelo == idMallaParalelo && !m.IdEstadoMatriculaNavigation.Completado, ct);
        }

        public async Task<MallaParalelo> AddAsync(MallaParalelo entity, CancellationToken ct)
        {
            await _context.MallaParalelo.AddAsync(entity, ct);
            await _context.SaveChangesAsync(ct);
            return entity;
        }
    }
}
