using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class PersonaAlergiasRepository : IPersonaAlergias
{
    private readonly Ammi_OnlineContext _context;
    public PersonaAlergiasRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PersonaAlergias>> FindAsync(
        int? idPersonaAlergias,
        int? idPersona,
        int? idTipoAlergia,
        string? detalle,
        CancellationToken cancellationToken)
    {
        IQueryable<PersonaAlergias> query =
            _context.PersonaAlergias.AsNoTracking();
        if (idPersonaAlergias.HasValue)
            query = query.Where(x => x.IdPersonaAlergias == idPersonaAlergias.Value);
        if (idPersona.HasValue)
            query = query.Where(x => x.IdPersona == idPersona.Value);
        if (idTipoAlergia.HasValue)
            query = query.Where(x => x.IdTipoAlergia == idTipoAlergia.Value);
        if (!string.IsNullOrEmpty(detalle))
            query = query.Where(x => x.Detalle.Contains(detalle));
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<PersonaAlergias> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var personaAlergia = await _context.PersonaAlergias
            .FirstOrDefaultAsync(
                x => x.IdPersonaAlergias == id, cancellationToken);
        if (personaAlergia == null)
            throw new KeyNotFoundException("Persona Alergia no encontrada.");
        return personaAlergia;
    }

    public async Task<PersonaAlergias> AddAsync(PersonaAlergias personaAlergias, CancellationToken cancellationToken)
    {
        await _context.PersonaAlergias.AddAsync(personaAlergias, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return personaAlergias;
    }

    public async Task<PersonaAlergias> UpdateAsync(PersonaAlergias personaAlergias, CancellationToken cancellationToken)
    {
        _context.PersonaAlergias.Update(personaAlergias);
        await _context.SaveChangesAsync(cancellationToken);
        return personaAlergias;
    }

    public async Task<PersonaAlergias> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var personaAlergia = await _context.PersonaAlergias.FindAsync(new object[] { id }, cancellationToken);
        if (personaAlergia == null)
            throw new KeyNotFoundException("Persona Alergia no encontrada.");
        _context.PersonaAlergias.Remove(personaAlergia);
        await _context.SaveChangesAsync(cancellationToken);
        return personaAlergia;
    }
    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PersonaAlergias
            .AnyAsync(x => x.IdPersonaAlergias == id, cancellationToken);
    }
}
