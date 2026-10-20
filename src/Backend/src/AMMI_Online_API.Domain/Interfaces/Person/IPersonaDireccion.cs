using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person;

public interface IPersonaDireccion
{
    Task<IEnumerable<PersonaDireccion>> FindAsync(
        int? idPersonaDireccion,
        int? idPersona,
        int? idParroquia,
        string? direccionDomiciliaria,
        bool? activo,
        CancellationToken cancellationToken);
    Task<PersonaDireccion> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<PersonaDireccion> AddAsync(PersonaDireccion personaDireccion, CancellationToken cancellationToken);
    Task<PersonaDireccion> UpdateAsync(PersonaDireccion personaDireccion, CancellationToken cancellationToken);
    Task<PersonaDireccion> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
