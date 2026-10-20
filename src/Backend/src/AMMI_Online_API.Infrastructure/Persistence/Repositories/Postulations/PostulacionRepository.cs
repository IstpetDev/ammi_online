using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Postulations;

public class PostulacionRepository : IPostulacionRepository
{
    private readonly Ammi_OnlineContext _context;

    public PostulacionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Postulacion>> GetPostulacionesByPersonaIdAsync(int idPersona, CancellationToken cancellationToken)
    {
        return await _context.Postulacion
            .AsNoTracking()
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.PersonaInfo)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCursosNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdTipoOfertaNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
            .Include(p => p.IdTipoEstadoAprobacionNavigation)
            .Where(p => p.IdPersona == idPersona)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Postulacion>> GetAllPostulacionesWithDetailsAsync(CancellationToken cancellationToken)
    {
        return await _context.Postulacion
            .AsNoTracking()
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.PersonaInfo)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCursosNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdTipoOfertaNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
            .Include(p => p.IdTipoEstadoAprobacionNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<Postulacion?> GetPostulacionByIdAsync(int idPostulacion, CancellationToken cancellationToken)
    {
        return await _context.Postulacion
            .FirstOrDefaultAsync(p => p.IdPostulacion == idPostulacion, cancellationToken);
    }

    public async Task<int> UpdateMallaAsync(int idPostulacion, int idMalla, CancellationToken cancellationToken)
    {
        var postulacion = await _context.Postulacion
            .FirstOrDefaultAsync(p => p.IdPostulacion == idPostulacion, cancellationToken);

        if (postulacion != null)
        {
            postulacion.IdMalla = idMalla;
            return await _context.SaveChangesAsync(cancellationToken);
        }

        return 0;
    }
}
