using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IEspecieRepository
{
    Task<Especie?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Especie>> GetAllAsync(CancellationToken cancellationToken);
    Task<Especie> AddAsync(Especie especie, CancellationToken cancellationToken);
    Task<Especie> UpdateAsync(Especie especie, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
