using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person;

public interface IPersonaActividadEconomica
{
    Task<IEnumerable<PersonaActividadEconomica>> FindAsync(
        int? idPersonaActividadEconomica,
        int? idPersona,
        int? idTipoActividadEconomica,
        decimal? valor,
        bool? esPrincipal,
        bool? activo,
        CancellationToken cancellationToken);
    Task<PersonaActividadEconomica> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<PersonaActividadEconomica> AddAsync(PersonaActividadEconomica personaActividadEconomica, CancellationToken cancellationToken);
    Task<PersonaActividadEconomica> UpdateAsync(PersonaActividadEconomica personaActividadEconomica, CancellationToken cancellationToken);
    Task<PersonaActividadEconomica> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
