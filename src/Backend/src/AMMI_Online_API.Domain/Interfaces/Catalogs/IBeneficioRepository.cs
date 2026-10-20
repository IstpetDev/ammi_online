using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IBeneficioRepository
{
    Task<Beneficio?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<Beneficio?> GetByIdEspecieAsync(int idEspecie, CancellationToken cancellationToken);
    Task<IEnumerable<Beneficio>> GetAllAsync(CancellationToken cancellationToken);
    Task<Beneficio> AddAsync(Beneficio beneficio, CancellationToken cancellationToken);
    Task<Beneficio> UpdateAsync(Beneficio beneficio, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);

}
