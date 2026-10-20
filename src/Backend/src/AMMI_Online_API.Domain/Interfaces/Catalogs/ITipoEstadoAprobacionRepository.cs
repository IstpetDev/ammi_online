using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoEstadoAprobacionRepository
{
    Task<TipoEstadoAprobacion?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoEstadoAprobacion>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoEstadoAprobacion> AddAsync(TipoEstadoAprobacion tipoEstadoAprobacion, CancellationToken cancellationToken);
    Task<TipoEstadoAprobacion> UpdateAsync(TipoEstadoAprobacion tipoEstadoAprobacion, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
