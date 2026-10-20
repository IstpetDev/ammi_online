using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IEtniaRepository
{
    Task<Etnia> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Etnia>> GetAllAsync(CancellationToken cancellationToken);
    Task<Etnia> AddAsync(Etnia etnia, CancellationToken cancellationToken);
    Task<Etnia> UpdateAsync(Etnia etnia, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
