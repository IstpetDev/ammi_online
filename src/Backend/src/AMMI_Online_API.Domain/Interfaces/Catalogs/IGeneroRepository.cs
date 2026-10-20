using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface IGeneroRepository
    {
        Task<Genero> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<IEnumerable<Genero>> GetAllAsync(CancellationToken cancellationToken);
        Task<Genero> AddAsync(Genero genero, CancellationToken cancellationToken);
        Task<Genero> UpdateAsync(Genero genero, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
