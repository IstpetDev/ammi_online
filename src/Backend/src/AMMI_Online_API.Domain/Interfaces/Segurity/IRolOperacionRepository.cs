using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Segurity;

public interface IRolOperacionRepository
{
    Task<RolOperacion?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<RolOperacion>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<RolOperacion>> GetByRolAsync(int idRol, CancellationToken cancellationToken);
    Task<IEnumerable<RolOperacion>> GetByModuloOperacionAsync(int idModuloOperacion, CancellationToken cancellationToken);
    Task<IEnumerable<RolOperacion>> GetActivosAsync(CancellationToken cancellationToken);
    Task<RolOperacion> AddAsync(RolOperacion rolOperacion, CancellationToken cancellationToken);
    Task<RolOperacion> UpdateAsync(RolOperacion rolOperacion, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
