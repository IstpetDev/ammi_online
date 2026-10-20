using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class PersonaActividadEconomicaRepository : IPersonaActividadEconomica
{
    private readonly Ammi_OnlineContext _context;
    public PersonaActividadEconomicaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PersonaActividadEconomica>> FindAsync(
        int? idPersonaActividadEconomica,
        int? idPersona,
        int? idTipoActividadEconomica,
        decimal? valor,
        bool? esPrincipal,
        bool? activo,
        CancellationToken cancellationToken)
    {
        IQueryable<PersonaActividadEconomica> query =
            _context.PersonaActividadEconomica.AsNoTracking();
        if (idPersonaActividadEconomica.HasValue)
            query = query.Where(x => x.IdPersonaActividadEconomica == idPersonaActividadEconomica.Value);
        if (idPersona.HasValue)
            query = query.Where(x => x.IdPersona == idPersona.Value);
        if (idTipoActividadEconomica.HasValue)
            query = query.Where(x => x.IdTipoActividadEconomica == idTipoActividadEconomica.Value);
        if (valor.HasValue)
            query = query.Where(x => x.Valor == valor.Value);
        if (esPrincipal.HasValue)
            query = query.Where(x => x.EsPrincipal == esPrincipal.Value);
        if (activo.HasValue)
            query = query.Where(x => x.Activo == activo.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<PersonaActividadEconomica> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var personaActividad = await _context.PersonaActividadEconomica
            .FirstOrDefaultAsync(
                x => x.IdPersonaActividadEconomica == id, cancellationToken);
        if (personaActividad == null)
            throw new KeyNotFoundException("Actividad económica de la persona no encontrada.");
        return personaActividad;
    }

    public async Task<PersonaActividadEconomica> AddAsync(PersonaActividadEconomica personaActividadEconomica, CancellationToken cancellationToken)
    {
        var existingPrincipal = await _context.PersonaActividadEconomica
            .FirstOrDefaultAsync(x => x.IdPersona == personaActividadEconomica.IdPersona 
                && x.EsPrincipal 
                && personaActividadEconomica.EsPrincipal, cancellationToken);
        if (existingPrincipal != null)
            throw new InvalidOperationException("La persona ya tiene una actividad económica principal asignada.");
        await _context.PersonaActividadEconomica.AddAsync(personaActividadEconomica, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return personaActividadEconomica;
    }

    public async Task<PersonaActividadEconomica> UpdateAsync(PersonaActividadEconomica personaActividadEconomica, CancellationToken cancellationToken)
    {
        var existingPrincipal = await _context.PersonaActividadEconomica
            .FirstOrDefaultAsync(x => x.IdPersona == personaActividadEconomica.IdPersona 
                && x.EsPrincipal 
                && personaActividadEconomica.EsPrincipal
                && x.IdPersonaActividadEconomica != personaActividadEconomica.IdPersonaActividadEconomica, cancellationToken);
        if (existingPrincipal != null)
            throw new InvalidOperationException("La persona ya tiene una actividad económica principal asignada.");
        existingPrincipal.IdTipoActividadEconomica = personaActividadEconomica.IdTipoActividadEconomica;
        existingPrincipal.Valor = personaActividadEconomica.Valor;
        existingPrincipal.EsPrincipal = personaActividadEconomica.EsPrincipal;
        _context.PersonaActividadEconomica.Update(existingPrincipal);
        await _context.SaveChangesAsync(cancellationToken);
        return personaActividadEconomica;
    }

    public async Task<PersonaActividadEconomica> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var personaActividad = await GetByIdAsync(id, cancellationToken);
        personaActividad.Activo = false;
        _context.PersonaActividadEconomica.Update(personaActividad);
        await _context.SaveChangesAsync(cancellationToken);
        return personaActividad;
    }   

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PersonaActividadEconomica
            .AnyAsync(x => x.IdPersonaActividadEconomica == id, cancellationToken);
    }
}
