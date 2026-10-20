using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IPaisRepository
{
    Task<Pais> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Pais>> GetAllAsync(CancellationToken cancellationToken);
    Task<Pais> AddAsync(Pais pais, CancellationToken cancellationToken);
    Task<Pais> UpdateAsync(Pais pais, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
