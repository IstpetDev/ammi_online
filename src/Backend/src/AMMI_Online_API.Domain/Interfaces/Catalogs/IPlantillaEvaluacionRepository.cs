using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IPlantillaEvaluacionRepository
{
    Task<PlantillaEvaluacion?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<PlantillaEvaluacion>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<PlantillaEvaluacion>> GetActivosAsync(CancellationToken cancellationToken);
    Task<PlantillaEvaluacion> AddAsync(PlantillaEvaluacion plantillaEvaluacion, CancellationToken cancellationToken);
    Task<PlantillaEvaluacion> UpdateAsync(PlantillaEvaluacion plantillaEvaluacion, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
