using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IEstadoCivilRepository
{
    Task<EstadoCivil> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<EstadoCivil>> GetAllAsync(CancellationToken cancellationToken);
    Task<EstadoCivil> AddAsync(EstadoCivil estadoCivil, CancellationToken cancellationToken);
    Task<EstadoCivil> UpdateAsync(EstadoCivil estadoCivil, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
