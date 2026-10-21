using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person
{
    public interface IPersonaInfo
    {
        Task<IEnumerable<PersonaInfo>> FindAsync(
            int? idPersona,
            DateOnly? fechaNacimiento,
            int? idEstadoCivil,
            int? idNacionalidadEtnica,
            CancellationToken cancellationToken);
        Task<PersonaInfo?> GeyByIdAsync(int id, CancellationToken cancellationToken);
        Task<PersonaInfo> AddAsync(PersonaInfo personaInfo, CancellationToken cancellationToken);
        Task<PersonaInfo> UpdateAsync(PersonaInfo personaInfo, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
