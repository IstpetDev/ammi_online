using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Infrastructure;

public interface IDetalleMallaRepository
{
    Task<DetalleMalla?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<DetalleMalla>> GetByMallaIdAsync(int idMalla, CancellationToken cancellationToken);
    Task<IEnumerable<DetalleMalla>> GetByMallaIdPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken cancellationToken);
    Task<int> CountByMallaIdAsync(int idMalla, CancellationToken cancellationToken);
    Task<IEnumerable<DetalleMalla>> GetAllAsync(CancellationToken cancellationToken);
    Task<DetalleMalla> AddAsync(DetalleMalla detalleMalla, CancellationToken cancellationToken);
    Task<IEnumerable<DetalleMalla>> AddRangeAsync(IEnumerable<DetalleMalla> detallesMalla, CancellationToken cancellationToken);
    Task<DetalleMalla> UpdateAsync(DetalleMalla detalleMalla, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsMateriaInMallaAsync(int idMalla, int idMateria, CancellationToken cancellationToken);
}
