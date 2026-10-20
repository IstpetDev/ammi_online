using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class EstudianteBeneficioRepository : IEstudianteBeneficioRepository
{
    private readonly Ammi_OnlineContext _context;

    public EstudianteBeneficioRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<EstudianteBeneficio?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.EstudianteBeneficio
            .Include(eb => eb.IdBeneficioNavigation)
            .AsNoTracking()
            .FirstOrDefaultAsync(eb => eb.IdEstudianteBeneficio == id, cancellationToken);
    }

    public async Task<IEnumerable<EstudianteBeneficio>> GetByAlumnoAsync(int idPersona, CancellationToken cancellationToken)
    {
        return await _context.EstudianteBeneficio
            .Include(eb => eb.IdBeneficioNavigation)
            .Where(eb => eb.IdPersona == idPersona)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Devuelve los beneficios activos y vigentes que aplican al alumno en el ciclo dado.
    /// Un beneficio aplica si: IdCiclo IS NULL (permanente) o IdCiclo = idCiclo.
    /// También verifica FechaFin y Activo.
    /// </summary>
    public async Task<IEnumerable<EstudianteBeneficio>> GetActivosByAlumnoCicloAsync(
        int idPersona,
        int idCiclo,
        CancellationToken cancellationToken)
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);

        return await _context.EstudianteBeneficio
            .Include(eb => eb.IdBeneficioNavigation)
            .Where(eb =>
                eb.IdPersona == idPersona &&
                eb.Activo &&
                eb.FechaInicio <= hoy &&
                (eb.FechaFin == null || eb.FechaFin >= hoy) &&
                eb.IdBeneficioNavigation.Activo &&
                (eb.IdCiclo == null || eb.IdCiclo == idCiclo))
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<EstudianteBeneficio> AddAsync(EstudianteBeneficio entity, CancellationToken cancellationToken)
    {
        entity.FechaAsignacion = DateTime.Now;
        await _context.EstudianteBeneficio.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<EstudianteBeneficio> UpdateAsync(EstudianteBeneficio entity, CancellationToken cancellationToken)
    {
        _context.EstudianteBeneficio.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }
}
