using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Segurity;

public interface IModuloOperacionRepository
{
    Task<ModuloOperacion?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<ModuloOperacion>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<ModuloOperacion>> GetByModuloAsync(int idModulo, CancellationToken cancellationToken);
    Task<IEnumerable<ModuloOperacion>> GetByOperacionAsync(int idOperacion, CancellationToken cancellationToken);
    Task<IEnumerable<ModuloOperacion>> GetActivosAsync(CancellationToken cancellationToken);
    Task<ModuloOperacion> AddAsync(ModuloOperacion moduloOperacion, CancellationToken cancellationToken);
    Task<ModuloOperacion> UpdateAsync(ModuloOperacion moduloOperacion, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    Task<ModuloOperacion?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken);
}
