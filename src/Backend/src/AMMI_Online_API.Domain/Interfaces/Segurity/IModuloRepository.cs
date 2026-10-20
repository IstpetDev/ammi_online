using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Segurity;

public interface IModuloRepository
{
    Task<Modulo?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Modulo>> GetAllAsync(CancellationToken cancellationToken);
    Task<Modulo> AddAsync(Modulo modulo, CancellationToken cancellationToken);
    Task<Modulo> UpdateAsync(Modulo modulo, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
