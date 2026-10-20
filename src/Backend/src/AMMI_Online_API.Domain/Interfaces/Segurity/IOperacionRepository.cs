using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Segurity;

public interface IOperacionRepository
{
    Task<Operacion?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Operacion>> GetAllAsync(CancellationToken cancellationToken);
    Task<Operacion> AddAsync(Operacion operacion, CancellationToken cancellationToken);
    Task<Operacion> UpdateAsync(Operacion operacion, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
