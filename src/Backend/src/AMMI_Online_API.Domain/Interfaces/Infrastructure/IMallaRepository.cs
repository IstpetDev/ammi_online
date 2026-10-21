using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Infrastructure;

public interface IMallaRepository
{
    Task<Malla?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Malla>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Malla>> GetAllPagedAsync(int? idMalla, string? detalle, int? idCursos, int? idCiclo, int pageNumber, int pageSize, CancellationToken cancellationToken);
    Task<int> CountAllAsync(int? idMalla, string? detalle, int? idCursos, int? idCiclo, CancellationToken cancellationToken);
    Task<Malla> AddAsync(Malla malla, CancellationToken cancellationToken);
    Task<Malla> UpdateAsync(Malla malla, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<Malla>> GetByTipoOfertaWithActiveCicloAsync(int idTipoOferta, CancellationToken cancellationToken);
    Task<IEnumerable<Malla>> GetByCicloIdAsync(int idCiclo, CancellationToken cancellationToken);
    Task<Malla?> GetByIdWithRelationsAsync(int idMalla, CancellationToken cancellationToken);
    Task<IEnumerable<Malla>> GetMallasWithRelationsForConfiguracionAsync(int idCiclo, CancellationToken cancellationToken);
}
