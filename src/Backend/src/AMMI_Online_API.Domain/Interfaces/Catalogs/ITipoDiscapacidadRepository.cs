using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoDiscapacidadRepository
{
    Task<TipoDiscapacidad> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoDiscapacidad>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoDiscapacidad> AddAsync(TipoDiscapacidad tipoDiscapacidad, CancellationToken cancellationToken);
    Task<TipoDiscapacidad> UpdateAsync(TipoDiscapacidad tipoDiscapacidad, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
