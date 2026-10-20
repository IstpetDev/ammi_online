using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;
public class PersonaInfoRepository : IPersonaInfo
{
    private readonly Ammi_OnlineContext _context;
    public PersonaInfoRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PersonaInfo>> FindAsync(
        int? idPersona,
        DateOnly? fechaNacimiento,
        int? idEstadoCivil,
        int? idNacionalidadEtnica,
        int? idTipoSangre,
        CancellationToken cancellationToken)
    {
        IQueryable<PersonaInfo> query =
            _context.PersonaInfo.AsNoTracking();
        if (idPersona.HasValue)
            query = query.Where(x => x.IdPersona == idPersona.Value);
        if (fechaNacimiento.HasValue)
            query = query.Where(x => x.FechaNacimiento == fechaNacimiento.Value);
        if (idEstadoCivil.HasValue)
            query = query.Where(x => x.IdEstadoCivil == idEstadoCivil.Value);
        if (idNacionalidadEtnica.HasValue)
            query = query.Where(x => x.IdNacionalidadEtnica == idNacionalidadEtnica.Value);
        if (idTipoSangre.HasValue)
            query = query.Where(x => x.IdTipoSangre == idTipoSangre.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<PersonaInfo> GeyByIdAsync(int id, CancellationToken cancellationToken)
    {
        var personaInfo = await _context.PersonaInfo
            .FirstOrDefaultAsync(
                x => x.IdPersona == id, cancellationToken);
        if (personaInfo == null)
            throw new KeyNotFoundException("Informacion Adicional de la persona no encontrada.");
        return personaInfo;
    }

    public async Task<PersonaInfo> AddAsync(PersonaInfo personaInfo, CancellationToken cancellationToken)
    {
        await _context.PersonaInfo.AddAsync(personaInfo, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return personaInfo;
    }

    public async Task<PersonaInfo> UpdateAsync(PersonaInfo personaInfo, CancellationToken cancellationToken)
    {
        _context.PersonaInfo.Update(personaInfo);
        await _context.SaveChangesAsync(cancellationToken);
        return personaInfo;
    }
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var personaInfo = await _context.PersonaInfo.FindAsync(new object[] { id }, cancellationToken);
        if (personaInfo == null)
         throw new KeyNotFoundException("Informacion Adicional de la Persona no encontrada");
        _context.PersonaInfo.Remove(personaInfo);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.PersonaInfo.AnyAsync(x => x.IdPersona == id, cancellationToken);
    }
}
