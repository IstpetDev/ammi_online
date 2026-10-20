using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class PersonaDiscapacidadRepository : IPersonaDiscapacidad
{
    private readonly Ammi_OnlineContext _context;
    public PersonaDiscapacidadRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }
    public async Task<IEnumerable<PersonaDiscapacidad>> FindAsync (
        int? idPersonaDiscapacidad,
        int? idPersona,
        int? porcentaje,
        string? recomendaciones,
        int? idTipoDiscapacidad,
        int? idAdjunto,
        CancellationToken cancellationToken)
    {
        IQueryable<PersonaDiscapacidad> query = _context.PersonaDiscapacidad.AsNoTracking();
        if (idPersonaDiscapacidad.HasValue)
            query = query.Where(pd => pd.IdPersonaDiscapacidad == idPersonaDiscapacidad.Value);
        if (idPersona.HasValue)
            query = query.Where(pd => pd.IdPersona == idPersona.Value);
        if (porcentaje.HasValue)
            query = query.Where(pd => pd.Porcentaje == porcentaje.Value);
        if (!string.IsNullOrEmpty(recomendaciones))
            query = query.Where(pd => pd.Recomendaciones.Contains(recomendaciones));
        if (idTipoDiscapacidad.HasValue)
            query = query.Where(pd => pd.IdTipoDiscapacidad == idTipoDiscapacidad.Value);
        if (idAdjunto.HasValue)
            query = query.Where(pd => pd.IdAdjunto == idAdjunto.Value);
      return await query.ToListAsync(cancellationToken);
    }

    public async Task<PersonaDiscapacidad> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var personaDiscapacidad = await _context.PersonaDiscapacidad
            .FirstOrDefaultAsync(pd => pd.IdPersonaDiscapacidad == id, cancellationToken);
        if (personaDiscapacidad == null)
            throw new KeyNotFoundException("Persona Discapacidad not found.");
        return personaDiscapacidad;
    }
    public async Task<PersonaDiscapacidad> AddAsync(PersonaDiscapacidad personaDiscapacidad, CancellationToken cancellationToken)
    {
        await _context.PersonaDiscapacidad.AddAsync(personaDiscapacidad, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return personaDiscapacidad;
    }
    public async Task<PersonaDiscapacidad> UpdateAsync(PersonaDiscapacidad personaDiscapacidad, CancellationToken cancellationToken)
    {
        _context.PersonaDiscapacidad.Update(personaDiscapacidad);
        await _context.SaveChangesAsync(cancellationToken);
        return personaDiscapacidad;
    }
    public async Task<PersonaDiscapacidad> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var personaDiscapacidad = await _context.PersonaDiscapacidad.FindAsync(new object[] { id }, cancellationToken);
        if (personaDiscapacidad == null)
            throw new KeyNotFoundException("Persona Discapacidad not found.");
        _context.PersonaDiscapacidad.Remove(personaDiscapacidad);
        await _context.SaveChangesAsync(cancellationToken);
        return personaDiscapacidad;
    }
    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PersonaDiscapacidad.AnyAsync(pd => pd.IdPersonaDiscapacidad == id, cancellationToken);
    }
}
