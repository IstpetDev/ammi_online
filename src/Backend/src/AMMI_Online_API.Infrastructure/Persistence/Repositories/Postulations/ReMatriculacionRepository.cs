using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Postulations;

public class ReMatriculacionRepository : IReMatriculacionRepository
{
    private readonly Ammi_OnlineContext _context;

    public ReMatriculacionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<Matricula?> GetUltimaMatriculaConDetallesAsync(int idPersona, CancellationToken ct)
    {
        // Usuario.IdPersona is the PK, same value as Persona.IdPersona
        return await _context.Matricula
            .AsNoTracking()
            .Include(m => m.DetalleMatricula)
            .Include(m => m.IdEstadoMatriculaNavigation)
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdMallaNavigation)
                    .ThenInclude(ma => ma.IdCursosNavigation)
            .Include(m => m.IdMallaParaleloNavigation)
                .ThenInclude(mp => mp.IdMallaNavigation)
                    .ThenInclude(ma => ma.IdCicloNavigation)
                        .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Where(m => m.IdUsuarioAlumno == idPersona)
            .OrderByDescending(m => m.IdMatricula)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<Malla?> GetMallaParaRepetirAsync(int idCursos, int idCicloDestino, CancellationToken ct)
    {
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.IdCicloNavigation)
            .FirstOrDefaultAsync(m => m.IdCursos == idCursos && m.IdCiclo == idCicloDestino, ct);
    }

    public async Task<Malla?> GetMallaParaSiguienteNivelAsync(
        int ordenSiguiente, int idCicloDestino, CancellationToken ct)
    {
        return await _context.Malla
            .AsNoTracking()
            .Include(m => m.IdCursosNavigation)
            .Include(m => m.IdCicloNavigation)
            .Where(m =>
                m.IdCiclo == idCicloDestino &&
                m.IdCursosNavigation.Orden == ordenSiguiente)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<IEnumerable<(MallaParalelo Paralelo, int Matriculados)>> GetParalelosConCupoAsync(
        int idMalla, CancellationToken ct)
    {
        var paralelos = await _context.MallaParalelo
            .AsNoTracking()
            .Include(mp => mp.IdParaleloNavigation)
            .Include(mp => mp.Matricula)
                .ThenInclude(m => m.IdEstadoMatriculaNavigation)
            .Where(mp => mp.IdMalla == idMalla && mp.EsActivo)
            .ToListAsync(ct);

        return paralelos.Select(mp =>
        {
            // Contar solo matrículas activas (estado no completado)
            int matriculados = mp.Matricula
                .Count(m => m.IdEstadoMatriculaNavigation?.Completado == false);
            return (mp, matriculados);
        });
    }

    public async Task<bool> AlumnoYaMatriculadoEnMallaAsync(int idPersona, int idMalla, CancellationToken ct)
    {
        return await _context.Matricula
            .AnyAsync(m =>
                m.IdUsuarioAlumno == idPersona &&
                m.IdMallaParaleloNavigation.IdMalla == idMalla &&
                m.IdEstadoMatriculaNavigation.Completado == false, ct);
    }

    public async Task<bool> TieneDeudasPendientesAsync(int idPersona, CancellationToken ct)
    {
        return await _context.Credito
            .AnyAsync(c =>
                c.IdMatriculaNavigation.IdUsuarioAlumno == idPersona &&
                c.SaldoPendiente > 0, ct);
    }
}
