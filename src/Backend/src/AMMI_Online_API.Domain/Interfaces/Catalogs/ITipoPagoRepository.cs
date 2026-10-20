using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoPagoRepository
{
    Task<TipoPago?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoPago>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoPago> AddAsync(TipoPago tipoPago, CancellationToken cancellationToken);
    Task<TipoPago> UpdateAsync(TipoPago tipoPago, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
