using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class InstitucionRepository : IInstitucion
{
    private readonly Ammi_OnlineContext _context;
    public InstitucionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Institucion>> FindAsync(
        int? idInstitucion,
        string? detalle,
        string? representanteLegal,
        string? ruc,
        int? idAdjunto,
        CancellationToken cancellationToken)
    {
        IQueryable<Institucion> query = _context.Institucion.AsNoTracking();
        if (idInstitucion.HasValue)
            query = query.Where(i => i.IdInstitucion == idInstitucion.Value);
        if (!string.IsNullOrWhiteSpace(detalle))
            query = query.Where(i => i.Detalle.Contains(detalle));
        if (!string.IsNullOrWhiteSpace(representanteLegal))
            query = query.Where(i => i.RepresentanteLegal.Contains(representanteLegal));
        if (!string.IsNullOrWhiteSpace(ruc))
            query = query.Where(i => i.Ruc.Contains(ruc));
        if (idAdjunto.HasValue)
            query = query.Where(i => i.IdAdjunto == idAdjunto.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Institucion?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Institucion.FirstOrDefaultAsync(
            i => i.IdInstitucion == id, cancellationToken);
    }   

    public async Task<Institucion> AddAsync(Institucion institucion, CancellationToken cancellationToken)
    {
        await _context.Institucion.AddAsync(institucion, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return institucion;
    }

    public async Task<Institucion> UpdateAsync(Institucion institucion, CancellationToken cancellationToken)
    {
        _context.Institucion.Update(institucion);
        await _context.SaveChangesAsync(cancellationToken);
        return institucion;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var institucion = await _context.Institucion.FindAsync(new object[] { id }, cancellationToken);
        if (institucion == null)
            return false;
        _context.Institucion.Remove(institucion);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Institucion.AnyAsync(
            i => i.IdInstitucion == id, cancellationToken);
    }
}
