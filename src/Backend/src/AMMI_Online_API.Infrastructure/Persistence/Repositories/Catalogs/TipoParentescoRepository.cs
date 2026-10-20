using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs
{
    public class TipoParentescoRepository : ITipoParentescoRepository
    {
        private readonly Ammi_OnlineContext _context;

        public TipoParentescoRepository(Ammi_OnlineContext context)
        {
            _context = context;
        }

        public async Task<TipoParentesco?> GetByIdAsync(int id, CancellationToken cancellationToken)
        {
            return await _context.TipoParentesco
                .AsNoTracking()
                .FirstOrDefaultAsync(tp => tp.IdTipoParentesco == id, cancellationToken);
        }

        public async Task<IEnumerable<TipoParentesco>> GetAllAsync(CancellationToken cancellationToken)
        {
            return await _context.TipoParentesco
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }

        public async Task<TipoParentesco> AddAsync(TipoParentesco tipoParentesco, CancellationToken cancellationToken)
        {
            await _context.TipoParentesco.AddAsync(tipoParentesco, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return tipoParentesco;
        }

        public async Task<TipoParentesco> UpdateAsync(TipoParentesco tipoParentesco, CancellationToken cancellationToken)
        {
            _context.TipoParentesco.Update(tipoParentesco);
            await _context.SaveChangesAsync(cancellationToken);
            return tipoParentesco;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
        {
            var tipoParentesco = await _context.TipoParentesco.FindAsync(new object[] { id }, cancellationToken);

            if (tipoParentesco == null)
                return false;

            _context.TipoParentesco.Remove(tipoParentesco);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
        {
            return await _context.TipoParentesco
                .AnyAsync(tp => tp.IdTipoParentesco == id, cancellationToken);
        }
    }
}
