using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Infrastructure;

public interface IContenidoMallaRepository
{
    Task<ContenidoMalla?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<ContenidoMalla>> GetByDetalleMallaIdAsync(int idDetalleMalla, CancellationToken cancellationToken);
    Task<ContenidoMalla> AddAsync(ContenidoMalla entity, CancellationToken cancellationToken);
    Task<ContenidoMalla> UpdateAsync(ContenidoMalla entity, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}
