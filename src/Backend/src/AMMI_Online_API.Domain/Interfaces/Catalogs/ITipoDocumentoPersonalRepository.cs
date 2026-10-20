using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoDocumentoPersonalRepository
{
    Task<TipoDocumentoPersonal> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoDocumentoPersonal>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoDocumentoPersonal> AddAsync(TipoDocumentoPersonal tipoDocumentoPersonal, CancellationToken cancellationToken);
    Task<TipoDocumentoPersonal> UpdateAsync(TipoDocumentoPersonal tipoDocumentoPersonal, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
