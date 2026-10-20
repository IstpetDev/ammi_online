using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person;

public interface IPersonaAlergias
{
    Task<IEnumerable<PersonaAlergias>> FindAsync(
        int? idPersonaAlergias,
        int? idPersona,
        int? idTipoAlergia,
        string? detalle,
        CancellationToken cancellationToken);
    Task<PersonaAlergias> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<PersonaAlergias> AddAsync(PersonaAlergias personaAlergias, CancellationToken cancellationToken);
    Task<PersonaAlergias> UpdateAsync(PersonaAlergias personaAlergias, CancellationToken cancellationToken);
    Task<PersonaAlergias> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
