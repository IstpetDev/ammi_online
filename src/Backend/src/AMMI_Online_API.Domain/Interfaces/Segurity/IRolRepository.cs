using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Segurity;

public interface IRolRepository
{
    Task<Rol?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Rol>> GetAllAsync(CancellationToken cancellationToken);
    Task<Rol> AddAsync(Rol rol, CancellationToken cancellationToken);
    Task<Rol> UpdateAsync(Rol rol, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
