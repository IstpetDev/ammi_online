using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoPlantillaEstructuraRepository
{
    Task<TipoPlantillaEstrucutra?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoPlantillaEstrucutra>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoPlantillaEstrucutra> AddAsync(TipoPlantillaEstrucutra tipoPlantillaEstructura, CancellationToken cancellationToken);
    Task<TipoPlantillaEstrucutra> UpdateAsync(TipoPlantillaEstrucutra tipoPlantillaEstructura, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
