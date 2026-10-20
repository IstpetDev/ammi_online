using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoDocumentoRepository
{
    Task<TipoDocumento> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoDocumento>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoDocumento> AddAsync(TipoDocumento tipoDocumento, CancellationToken cancellationToken);
    Task<TipoDocumento> UpdateAsync(TipoDocumento tipoDocumento, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
