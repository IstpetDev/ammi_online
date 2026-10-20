using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class PersonaDireccionRepository : IPersonaDireccion
{
    private readonly Ammi_OnlineContext _context;
    public PersonaDireccionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PersonaDireccion>> FindAsync(
        int? idPersonaDireccion,
        int? idPersona,
        int? idParroquia,
        string? direccionDomiciliaria,
        bool? activo,
        CancellationToken cancellationToken)
    {
        IQueryable<PersonaDireccion> query =
            _context.PersonaDireccion.AsNoTracking();
        if (idPersonaDireccion.HasValue)
            query = query.Where(x => x.IdPersonaDireccion == idPersonaDireccion.Value);
        if (idPersona.HasValue)
            query = query.Where(x => x.IdPersona == idPersona.Value);
        if (idParroquia.HasValue)
            query = query.Where(x => x.IdParroquia == idParroquia.Value);
        if (!string.IsNullOrEmpty(direccionDomiciliaria))
            query = query.Where(x => x.DireccionDomiciliaria.Contains(direccionDomiciliaria));
        if (activo.HasValue)
            query = query.Where(x => x.Activo == activo.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<PersonaDireccion> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var personaDireccion = await _context.PersonaDireccion
            .FirstOrDefaultAsync(
                x => x.IdPersonaDireccion == id, cancellationToken);
        if (personaDireccion == null)
            throw new KeyNotFoundException("Dirección de la persona no encontrada.");
        return personaDireccion;
    }

    public async Task<PersonaDireccion> AddAsync(PersonaDireccion personaDireccion, CancellationToken cancellationToken)
    {
        await _context.PersonaDireccion.AddAsync(personaDireccion, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return personaDireccion;
    }

    public async Task<PersonaDireccion> UpdateAsync(PersonaDireccion personaDireccion, CancellationToken cancellationToken)
    {
        _context.PersonaDireccion.Update(personaDireccion);
        await _context.SaveChangesAsync(cancellationToken);
        return personaDireccion;
    }

    public async Task<PersonaDireccion> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var personaDireccion = await GetByIdAsync(id, cancellationToken);
        personaDireccion.Activo = false;
        _context.PersonaDireccion.Update(personaDireccion);
        await _context.SaveChangesAsync(cancellationToken);
        return personaDireccion;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PersonaDireccion
            .AnyAsync(x => x.IdPersonaDireccion == id, cancellationToken);
    }

}
