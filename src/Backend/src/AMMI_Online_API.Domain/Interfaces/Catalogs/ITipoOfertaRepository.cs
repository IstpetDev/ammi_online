using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoOfertaRepository
{
    Task<TipoOferta?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoOferta>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoOferta> AddAsync(TipoOferta tipoOferta, CancellationToken cancellationToken);
    Task<TipoOferta> UpdateAsync(TipoOferta tipoOferta, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
