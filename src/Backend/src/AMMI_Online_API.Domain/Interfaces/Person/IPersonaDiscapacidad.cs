using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person
{
    public interface IPersonaDiscapacidad
    {
        Task<IEnumerable<PersonaDiscapacidad>> FindAsync(
            int? idPersonaDiscapacidad,
            int? idPersona,
            int? porcentaje,
            string? recomendaciones,
            int? idTipoDiscapacidad,
            int? idAdjunto,
            CancellationToken cancellationToken);
        Task<PersonaDiscapacidad> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<PersonaDiscapacidad> AddAsync(PersonaDiscapacidad personaDiscapacidad, CancellationToken cancellationToken);
        Task<PersonaDiscapacidad> UpdateAsync(PersonaDiscapacidad personaDiscapacidad, CancellationToken cancellationToken);
        Task<PersonaDiscapacidad> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
