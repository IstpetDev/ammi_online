using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person
{
    public interface IPersonaNacionalidad
    {
        Task<IEnumerable<PersonaNacionalidad>> FindAsync(
            int? idPersonaNacionalidad,
            int? idPersona,
            int? idPais,
            string? nacio,
            CancellationToken cancellationToken);
        Task<PersonaNacionalidad?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<PersonaNacionalidad> AddAsync(PersonaNacionalidad personaNacionalidad, CancellationToken cancellationToken);
        Task<PersonaNacionalidad> UpdateAsync(PersonaNacionalidad personaNacionalidad, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }

}
