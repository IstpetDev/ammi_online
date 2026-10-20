using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Person;

public interface IParentesco
{
    Task<IEnumerable<Parentesco>> FindAsync(
        int? idParentesco,
        int? idPersonaOrigen,
        int? idPersonaDestino,
        int? idTipoParentesco,
        bool? representante,
        bool? tutor,
        bool? responsableFinciero,
        bool? conviveAlumno,
        CancellationToken cancellationToken);
    Task<Parentesco> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<Parentesco> AddAsync(Parentesco parentesco, CancellationToken cancellationToken);
    Task<Parentesco> UpdateAsync (Parentesco parentesco, CancellationToken cancellationToken);
    Task<Parentesco> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
