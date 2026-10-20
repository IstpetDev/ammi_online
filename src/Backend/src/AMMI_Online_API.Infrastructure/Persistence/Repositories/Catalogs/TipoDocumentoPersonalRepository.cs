using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoDocumentoPersonalRepository : ITipoDocumentoPersonalRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoDocumentoPersonalRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoDocumentoPersonal?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoDocumentoPersonal
            .AsNoTracking()
            .FirstOrDefaultAsync(tdp => tdp.IdTipoDocumentoPersonal == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoDocumentoPersonal>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoDocumentoPersonal
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoDocumentoPersonal> AddAsync(TipoDocumentoPersonal tipoDocumentoPersonal, CancellationToken cancellationToken)
    {
        await _context.TipoDocumentoPersonal.AddAsync(tipoDocumentoPersonal, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoDocumentoPersonal;
    }

    public async Task<TipoDocumentoPersonal> UpdateAsync(TipoDocumentoPersonal tipoDocumentoPersonal, CancellationToken cancellationToken)
    {
        _context.TipoDocumentoPersonal.Update(tipoDocumentoPersonal);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoDocumentoPersonal;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var tipoDocumentoPersonal = await _context.TipoDocumentoPersonal.FindAsync(new object[] { id }, cancellationToken);

        if (tipoDocumentoPersonal == null)
            return false;

        _context.TipoDocumentoPersonal.Remove(tipoDocumentoPersonal);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoDocumentoPersonal
            .AnyAsync(tdp => tdp.IdTipoDocumentoPersonal == id, cancellationToken);
    }
}
