using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class NacionalidadEtnicaRepository : INacionalidadEtnicaRepository
{
    private readonly Ammi_OnlineContext _context;

    public NacionalidadEtnicaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<NacionalidadEtnica?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.NacionalidadEtnica
            .AsNoTracking()
            .FirstOrDefaultAsync(ne => ne.IdnacionalidadEtnica == id, cancellationToken);
    }

    public async Task<IEnumerable<NacionalidadEtnica>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.NacionalidadEtnica
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<NacionalidadEtnica>> GetByEtniaAsync(int idEtnia, CancellationToken cancellationToken)
    {
        return await _context.NacionalidadEtnica
            .AsNoTracking()
            .Where(ne => ne.IdEtnia == idEtnia)
            .ToListAsync(cancellationToken);
    }

    public async Task<NacionalidadEtnica> AddAsync(NacionalidadEtnica nacionalidadEtnica, CancellationToken cancellationToken)
    {
        await _context.NacionalidadEtnica.AddAsync(nacionalidadEtnica, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return nacionalidadEtnica;
    }

    public async Task<NacionalidadEtnica> UpdateAsync(NacionalidadEtnica nacionalidadEtnica, CancellationToken cancellationToken)
    {
        _context.NacionalidadEtnica.Update(nacionalidadEtnica);
        await _context.SaveChangesAsync(cancellationToken);
        return nacionalidadEtnica;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var nacionalidadEtnica = await _context.NacionalidadEtnica.FindAsync(new object[] { id }, cancellationToken);

        if (nacionalidadEtnica == null)
            return false;

        _context.NacionalidadEtnica.Remove(nacionalidadEtnica);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.NacionalidadEtnica
            .AnyAsync(ne => ne.IdnacionalidadEtnica == id, cancellationToken);
    }
}
