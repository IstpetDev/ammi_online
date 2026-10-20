using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface ITipoParentescoRepository
    {
        Task<TipoParentesco> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<IEnumerable<TipoParentesco>> GetAllAsync(CancellationToken cancellationToken);
        Task<TipoParentesco> AddAsync(TipoParentesco tipoParentesco, CancellationToken cancellationToken);
        Task<TipoParentesco> UpdateAsync(TipoParentesco tipoParentesco, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
