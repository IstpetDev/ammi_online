using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IProvinciaRepository
{
    Task<Provincia> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Provincia>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Provincia>> GetByPaisAsync(int idPais, CancellationToken cancellationToken);
    Task<Provincia> AddAsync(Provincia provincia, CancellationToken cancellationToken);
    Task<Provincia> UpdateAsync(Provincia provincia, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
