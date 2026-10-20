using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IParroquiaRepository
{
    Task<Parroquia> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Parroquia>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Parroquia>> GetByCantonAsync(int idCanton, CancellationToken cancellationToken);
    Task<Parroquia> AddAsync(Parroquia parroquia, CancellationToken cancellationToken);
    Task<Parroquia> UpdateAsync(Parroquia parroquia, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
