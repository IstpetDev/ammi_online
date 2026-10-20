using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class ReglasCalculoRepository : IReglasCalculoRepository
{
    private readonly Ammi_OnlineContext _context;

    public ReglasCalculoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<ReglasCalculo?> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _context.ReglasCalculo
            .Include(r => r.IdTipoReglaCalculoNavigation)
            .Include(r => r.IdPlantillaEstructuraNavigation)
            .FirstOrDefaultAsync(r => r.IdReglasCalculo == id, ct);
    }

    public async Task<ReglasCalculo?> GetByPlantillaEstructuraAsync(int idPlantillaEstructura, CancellationToken ct)
    {
        return await _context.ReglasCalculo
            .Include(r => r.IdTipoReglaCalculoNavigation)
            .Include(r => r.IdPlantillaEstructuraNavigation)
            .FirstOrDefaultAsync(r => r.IdPlantillaEstructura == idPlantillaEstructura, ct);
    }

    public async Task<IEnumerable<ReglasCalculo>> GetByPlantillaEvaluacionAsync(int idPlantillaEvaluacion, CancellationToken ct)
    {
        return await _context.ReglasCalculo
            .Include(r => r.IdTipoReglaCalculoNavigation)
            .Include(r => r.IdPlantillaEstructuraNavigation)
            .Where(r => r.IdPlantillaEstructuraNavigation.IdPlantillaEvaluacion == idPlantillaEvaluacion)
            .ToListAsync(ct);
    }

    public async Task<ReglasCalculo> AddAsync(ReglasCalculo entity, CancellationToken ct)
    {
        await _context.ReglasCalculo.AddAsync(entity, ct);
        await _context.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(ReglasCalculo entity, CancellationToken ct)
    {
        _context.ReglasCalculo.Update(entity);
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var entity = await _context.ReglasCalculo.FindAsync(new object[] { id }, ct);
        if (entity != null)
        {
            _context.ReglasCalculo.Remove(entity);
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken ct)
    {
        return await _context.ReglasCalculo.AnyAsync(r => r.IdReglasCalculo == id, ct);
    }
}
