using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class PersonaNacionalidadRepository : IPersonaNacionalidad
{ 
    private readonly Ammi_OnlineContext _context;

    public PersonaNacionalidadRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PersonaNacionalidad>> FindAsync(
        int? idPersonaNacionalidad,
        int? idPersona,
        int? idPais,
        string? Nacio,
        CancellationToken cancellationToken)
    {
        IQueryable<PersonaNacionalidad> query =
            _context.PersonaNacionalidad.AsNoTracking();

        if (idPersonaNacionalidad.HasValue)
            query = query.Where(x => x.IdPersonaNacionalidad == idPersonaNacionalidad.Value);

        if (idPersona.HasValue)
            query = query.Where(x => x.IdPersona == idPersona.Value);

        if (idPais.HasValue)
            query = query.Where(x => x.IdPais == idPais.Value);

        if(!string.IsNullOrEmpty(Nacio))
            query = query.Where(x => x.Nacio.Contains(Nacio));
            
        return await query.ToListAsync(cancellationToken);
    }
    public async Task<PersonaNacionalidad?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PersonaNacionalidad
            .FirstOrDefaultAsync(
                x => x.IdPersonaNacionalidad == id, cancellationToken);
    }


    public async Task<PersonaNacionalidad> AddAsync(PersonaNacionalidad personaNacionalidad, CancellationToken cancellationToken)
    {
        await _context.PersonaNacionalidad.AddAsync(personaNacionalidad, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return personaNacionalidad;
    }
    public async Task<PersonaNacionalidad> UpdateAsync(PersonaNacionalidad personaNacionalidad, CancellationToken cancellationToken)
    {
        _context.PersonaNacionalidad.Update(personaNacionalidad);
        await _context.SaveChangesAsync(cancellationToken);
        return personaNacionalidad;
    }
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var personaNacionalidad = await _context.PersonaNacionalidad.FindAsync(new object[] { id }, cancellationToken);
        if (personaNacionalidad == null)
            return false;
        _context.PersonaNacionalidad.Remove(personaNacionalidad);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PersonaNacionalidad
            .AnyAsync(pn => pn.IdPersonaNacionalidad == id, cancellationToken);
    }

}
