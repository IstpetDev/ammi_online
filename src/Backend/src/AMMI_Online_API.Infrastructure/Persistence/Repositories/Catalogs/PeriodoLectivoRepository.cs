using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs
{
    public class PeriodoLectivoRepository : IPeriodoLectivo
    {
        private readonly Ammi_OnlineContext _context;
        public PeriodoLectivoRepository(Ammi_OnlineContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PeriodoLectivo>> FindAsync(
            int? idPeriodoLectivo,
            string? detalle,
            DateOnly? fechaInicioEstimada,
            DateOnly? fechaFinEstimada,
            CancellationToken cancellationToken)
        {
            IQueryable<PeriodoLectivo> query =
                _context.PeriodoLectivo.AsNoTracking();
            if (idPeriodoLectivo.HasValue)
                query = query.Where(x => x.IdPeriodoLectivo == idPeriodoLectivo.Value);
            if (!string.IsNullOrEmpty(detalle))
                query = query.Where(x => x.Detalle.Contains(detalle));
            if (fechaInicioEstimada.HasValue)
                query = query.Where(x => x.FechaInicioEstimada == fechaInicioEstimada.Value);
            if (fechaFinEstimada.HasValue)
                query = query.Where(x => x.FechaFinEstimada == fechaFinEstimada.Value);
            return await query.ToListAsync(cancellationToken);
        }

        public async Task<PeriodoLectivo?> GetByIdAsync(int id, CancellationToken cancellationToken)
        {
            return await _context.PeriodoLectivo.FirstOrDefaultAsync(
                x => x.IdPeriodoLectivo == id, cancellationToken);
        }
        public async Task<PeriodoLectivo> AddAsync(PeriodoLectivo periodoLectivo, CancellationToken cancellationToken)
        {
            await _context.PeriodoLectivo.AddAsync(periodoLectivo, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return periodoLectivo;
        }

        public async Task<PeriodoLectivo> UpdateAsync(PeriodoLectivo periodoLectivo, CancellationToken cancellationToken)
        {
            _context.PeriodoLectivo.Update(periodoLectivo);
            await _context.SaveChangesAsync(cancellationToken);
            return periodoLectivo;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
        {
            var periodoLectivo = await _context.PeriodoLectivo.FindAsync(new object[] { id }, cancellationToken);
            if (periodoLectivo == null)
            {
                return false;
            }
            _context.PeriodoLectivo.Remove(periodoLectivo);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
        {
            return await _context.PeriodoLectivo.AnyAsync(
                x => x.IdPeriodoLectivo == id, cancellationToken);
        }
    }
}
