using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class CicloRepository : ICiclo
{
    private readonly Ammi_OnlineContext _context;

    public CicloRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Ciclo>> FindAsync(
        int? idCiclo,
        int? idPadre,
        int? idPeriodo,
        int? idRegimen,
        string? detalle,
        DateOnly? fechaInicioEstimada,
        DateOnly? fechaFinEstimada,
        bool? EsActivo,
        CancellationToken cancellationToken)
    {
        var query = _context.Ciclo
            .AsNoTracking()
            .Include(c => c.IdPeriodoNavigation)
            .Include(c => c.IdRegimenNavigation)
            .Include(c => c.IdPadreNavigation)
            .AsQueryable();

        if (idCiclo.HasValue)
            query = query.Where(c => c.IdCiclo == idCiclo.Value);
        if (idPadre.HasValue)
            query = query.Where(c => c.IdPadre == idPadre.Value);
        if (idPeriodo.HasValue)
            query = query.Where(c => c.IdPeriodo == idPeriodo.Value);
        if (idRegimen.HasValue)
            query = query.Where(c => c.IdRegimen == idRegimen.Value);
        if (!string.IsNullOrWhiteSpace(detalle))
            query = query.Where(c => c.Detalle.Contains(detalle));
        if (fechaInicioEstimada.HasValue)
            query = query.Where(c => c.FechaInicioEstimada == fechaInicioEstimada.Value);
        if (fechaFinEstimada.HasValue)
            query = query.Where(c => c.FechaFinEstimada == fechaFinEstimada.Value);
        if (EsActivo.HasValue)
            query = query.Where(c => c.EsActivo == EsActivo.Value);

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Ciclo?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Ciclo
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdCiclo == id, cancellationToken);
    }

    public async Task<Ciclo> AddAsync(Ciclo ciclo, CancellationToken cancellationToken)
    {
        await _context.Ciclo.AddAsync(ciclo, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return ciclo;
    }

    public async Task<Ciclo> UpdateAsync(Ciclo ciclo, CancellationToken cancellationToken)
    {
        _context.Ciclo.Update(ciclo);
        await _context.SaveChangesAsync(cancellationToken);
        return ciclo;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var ciclo = await _context.Ciclo.FindAsync(new object[] { id }, cancellationToken);

        if (ciclo == null)
            return false;

        _context.Ciclo.Remove(ciclo);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Ciclo
            .AnyAsync(c => c.IdCiclo == id, cancellationToken);
    }
}
