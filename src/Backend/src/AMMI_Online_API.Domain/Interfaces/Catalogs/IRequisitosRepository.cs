using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IRequisitosRepository
{
    Task<Requisitos?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Requisitos>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Requisitos>> GetByMallaAsync(int idMalla, CancellationToken cancellationToken);
    Task<Requisitos> AddAsync(Requisitos requisitos, CancellationToken cancellationToken);
    Task<Requisitos> UpdateAsync(Requisitos requisitos, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
