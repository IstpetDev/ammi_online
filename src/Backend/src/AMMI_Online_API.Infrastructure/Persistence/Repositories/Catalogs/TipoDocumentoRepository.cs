using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoDocumentoRepository : ITipoDocumentoRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoDocumentoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoDocumento?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoDocumento
            .AsNoTracking()
            .FirstOrDefaultAsync(td => td.IdTipoDocumento == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoDocumento>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoDocumento
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoDocumento> AddAsync(TipoDocumento tipoDocumento, CancellationToken cancellationToken)
    {
        await _context.TipoDocumento.AddAsync(tipoDocumento, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoDocumento;
    }

    public async Task<TipoDocumento> UpdateAsync(TipoDocumento tipoDocumento, CancellationToken cancellationToken)
    {
        _context.TipoDocumento.Update(tipoDocumento);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoDocumento;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var tipoDocumento = await _context.TipoDocumento.FindAsync(new object[] { id }, cancellationToken);

        if (tipoDocumento == null)
            return false;

        _context.TipoDocumento.Remove(tipoDocumento);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoDocumento
            .AnyAsync(td => td.IdTipoDocumento == id, cancellationToken);
    }
}
