using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person
{
    public interface IPersona
    {
        Task<IEnumerable<Persona>> FindAsync(
            int? idPersona,
            int? idTipoDocumento,
            string? Documento,
            int? idGenero,
            string? primerNombre,
            string? segundoNombre,
            string? primerApellido,
            string? segundoApellido,
            bool? activo,
            CancellationToken cancellationToken
            );
        Task<Persona> GetByIdAsync (int id, CancellationToken cancellationToken);
        Task<Persona> AddAsync (Persona persona, CancellationToken cancellationToken);
        Task<Persona> UpdateAsync (Persona persona, CancellationToken cancellationToken);
        Task<Persona> DeleteAsync (int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync (int id, CancellationToken cancellationToken);
    }
}
