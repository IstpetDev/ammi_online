using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs
{
    public class GeneroRepository : IGeneroRepository
    {
        private readonly Ammi_OnlineContext _context;

        public GeneroRepository(Ammi_OnlineContext context)
        {
            _context = context;
        }

        public async Task<Genero?> GetByIdAsync(int id, CancellationToken cancellationToken)
        {
            return await _context.Genero
                .AsNoTracking()
                .FirstOrDefaultAsync(g => g.IdGenero == id, cancellationToken);
        }

        public async Task<IEnumerable<Genero>> GetAllAsync(CancellationToken cancellationToken)
        {
            return await _context.Genero
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }

        public async Task<Genero> AddAsync(Genero genero, CancellationToken cancellationToken)
        {
            await _context.Genero.AddAsync(genero, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return genero;
        }

        public async Task<Genero> UpdateAsync(Genero genero, CancellationToken cancellationToken)
        {
            _context.Genero.Update(genero);
            await _context.SaveChangesAsync(cancellationToken);
            return genero;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
        {
            var genero = await _context.Genero.FindAsync(new object[] { id }, cancellationToken);

            if (genero == null)
                return false;

            _context.Genero.Remove(genero);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
        {
            return await _context.Genero
                .AnyAsync(g => g.IdGenero == id, cancellationToken);
        }
    }
}