using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class TipoDatoContactoRepository : ITipoDatoContactoRepository
{
    private readonly Ammi_OnlineContext _context;

    public TipoDatoContactoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<TipoDatoContacto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoDatoContacto
            .AsNoTracking()
            .FirstOrDefaultAsync(tdc => tdc.IdTipoDatoContacto == id, cancellationToken);
    }

    public async Task<IEnumerable<TipoDatoContacto>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.TipoDatoContacto
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TipoDatoContacto> AddAsync(TipoDatoContacto tipoDatoContacto, CancellationToken cancellationToken)
    {
        await _context.TipoDatoContacto.AddAsync(tipoDatoContacto, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoDatoContacto;
    }

    public async Task<TipoDatoContacto> UpdateAsync(TipoDatoContacto tipoDatoContacto, CancellationToken cancellationToken)
    {
        _context.TipoDatoContacto.Update(tipoDatoContacto);
        await _context.SaveChangesAsync(cancellationToken);
        return tipoDatoContacto;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var tipoDatoContacto = await _context.TipoDatoContacto.FindAsync(new object[] { id }, cancellationToken);

        if (tipoDatoContacto == null)
            return false;

        _context.TipoDatoContacto.Remove(tipoDatoContacto);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TipoDatoContacto
            .AnyAsync(tdc => tdc.IdTipoDatoContacto == id, cancellationToken);
    }
}
