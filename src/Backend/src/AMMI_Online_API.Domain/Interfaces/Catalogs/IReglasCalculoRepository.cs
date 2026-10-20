using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IReglasCalculoRepository
{
    Task<ReglasCalculo?> GetByIdAsync(int id, CancellationToken ct);
    Task<ReglasCalculo?> GetByPlantillaEstructuraAsync(int idPlantillaEstructura, CancellationToken ct);
    Task<IEnumerable<ReglasCalculo>> GetByPlantillaEvaluacionAsync(int idPlantillaEvaluacion, CancellationToken ct);
    Task<ReglasCalculo> AddAsync(ReglasCalculo entity, CancellationToken ct);
    Task UpdateAsync(ReglasCalculo entity, CancellationToken ct);
    Task DeleteAsync(int id, CancellationToken ct);
    Task<bool> ExistsAsync(int id, CancellationToken ct);
}
