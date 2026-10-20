using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoSangreRepository
{
    Task<IEnumerable<TipoSangre>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoSangre?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<TipoSangre> AddAsync(TipoSangre tipoSangre, CancellationToken cancellationToken);
    Task<TipoSangre> UpdateAsync(TipoSangre tipoSangre, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
