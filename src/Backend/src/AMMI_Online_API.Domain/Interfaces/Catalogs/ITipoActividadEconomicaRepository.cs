using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoActividadEconomicaRepository
{
    Task<TipoActividadEconomica?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoActividadEconomica>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoActividadEconomica> AddAsync(TipoActividadEconomica tipoActividadEconomica, CancellationToken cancellationToken);
    Task<TipoActividadEconomica> UpdateAsync(TipoActividadEconomica tipoActividadEconomica, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
