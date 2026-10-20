using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoReglaCalculoRepository
{
    Task<TipoReglaCalculo?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoReglaCalculo>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoReglaCalculo> AddAsync(TipoReglaCalculo tipoReglaCalculo, CancellationToken cancellationToken);
    Task<TipoReglaCalculo> UpdateAsync(TipoReglaCalculo tipoReglaCalculo, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
