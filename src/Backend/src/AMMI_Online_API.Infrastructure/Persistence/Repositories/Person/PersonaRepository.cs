using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;

public class PersonaRepository : IPersona
{
    private readonly Ammi_OnlineContext _context;
    public PersonaRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Persona>> FindAsync(
        int? idPersona,
        int? idTipoDocumento,
        string? Documento,
        int? idGenero,
        string? primerNombre,
        string? segundoNombre,
        string? primerApellido,
        string? segundoApellido,
        bool? activo,
        CancellationToken cancellationToken)
    {
        IQueryable<Persona> query = _context.Persona.AsNoTracking();
        if (idPersona.HasValue)
            query = query.Where(p => p.IdPersona == idPersona.Value);
        if (idTipoDocumento.HasValue)
            query = query.Where(p => p.IdTipoDocumento == idTipoDocumento.Value);
        if (!string.IsNullOrEmpty(Documento))
            query = query.Where(p => p.Documento == Documento);
        if (idGenero.HasValue)
            query = query.Where(p => p.IdGenero == idGenero.Value);
        if (!string.IsNullOrEmpty(primerNombre))
            query = query.Where(p => p.PrimerNombre == primerNombre);
        if (!string.IsNullOrEmpty(segundoNombre))
            query = query.Where(p => p.SegundoNombre == segundoNombre);
        if (!string.IsNullOrEmpty(primerApellido))
            query = query.Where(p => p.PrimerApellido == primerApellido);
        if (!string.IsNullOrEmpty(segundoApellido))
            query = query.Where(p => p.SegundoApellido == segundoApellido);
        if (activo.HasValue)
            query = query.Where(p => p.Activo == activo.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Persona> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var persona = await _context.Persona
            .FirstOrDefaultAsync(p => p.IdPersona == id, cancellationToken);
        if (persona == null)
            throw new KeyNotFoundException("Persona no encontrada.");
        return persona;
    }
    public async Task<Persona> AddAsync(Persona persona, CancellationToken cancellationToken)
    {
        await _context.Persona.AddAsync(persona, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return persona;
    }
    public async Task<Persona> UpdateAsync(Persona persona, CancellationToken cancellationToken)
    {
        _context.Persona.Update(persona);
        await _context.SaveChangesAsync(cancellationToken);
        return persona;
    }

    public async Task<Persona> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var persona = await _context.Persona.FindAsync(new object[] { id }, cancellationToken);
        if (persona == null)
            throw new KeyNotFoundException("Persona no encontrada.");
        _context.Persona.Remove(persona);
        await _context.SaveChangesAsync(cancellationToken);
        return persona;
    }
    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Persona.AnyAsync(p => p.IdPersona == id, cancellationToken);
    }

}
