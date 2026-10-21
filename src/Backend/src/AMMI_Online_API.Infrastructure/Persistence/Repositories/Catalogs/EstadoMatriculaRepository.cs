using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;

public class EstadoMatriculaRepository : IEstadoMatriculaRepository
{
    private readonly Ammi_OnlineContext _context;

    public EstadoMatriculaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EstadoMatricula>> GetAllAsync(CancellationToken ct)
    {
        return await _context.EstadoMatricula.AsNoTracking().ToListAsync(ct);
    }

    public async Task<EstadoMatricula?> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _context.EstadoMatricula.FindAsync(new object[] { id }, ct);
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken ct)
    {
        return await _context.EstadoMatricula.AnyAsync(x => x.IdEstadoMatricula == id, ct);
    }
}
