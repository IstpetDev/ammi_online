using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ICantonRepository
{
    Task<Canton> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Canton>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Canton>> GetByProvinciaAsync(int idProvincia, CancellationToken cancellationToken);
    Task<Canton> AddAsync(Canton canton, CancellationToken cancellationToken);
    Task<Canton> UpdateAsync(Canton canton, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
