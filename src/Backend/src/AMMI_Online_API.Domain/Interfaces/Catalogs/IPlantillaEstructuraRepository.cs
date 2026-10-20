using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IPlantillaEstructuraRepository
{
    Task<PlantillaEstructura?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<PlantillaEstructura>> GetByPlantillaIdAsync(int idPlantillaEvaluacion, CancellationToken cancellationToken);
    Task<IEnumerable<PlantillaEstructura>> GetHijosAsync(int idNodoPadre, CancellationToken cancellationToken);
    Task<PlantillaEstructura> AddAsync(PlantillaEstructura entity, CancellationToken cancellationToken);
    Task<IEnumerable<PlantillaEstructura>> AddRangeAsync(IEnumerable<PlantillaEstructura> entities, CancellationToken cancellationToken);
    Task<PlantillaEstructura> UpdateAsync(PlantillaEstructura entity, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> DeleteRangeAsync(IEnumerable<PlantillaEstructura> entities, CancellationToken cancellationToken);
}
