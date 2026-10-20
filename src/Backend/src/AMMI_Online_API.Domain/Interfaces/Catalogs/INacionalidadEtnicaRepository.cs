using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface INacionalidadEtnicaRepository
{
    Task<NacionalidadEtnica> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<NacionalidadEtnica>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<NacionalidadEtnica>> GetByEtniaAsync(int idEtnia, CancellationToken cancellationToken);
    Task<NacionalidadEtnica> AddAsync(NacionalidadEtnica nacionalidadEtnica, CancellationToken cancellationToken);
    Task<NacionalidadEtnica> UpdateAsync(NacionalidadEtnica nacionalidadEtnica, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
