using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface IParalelo
    {
        Task<IEnumerable<Paralelo>> FindAsync(
            int? idParalelo,
            string? nombreParalelo,
            int? cupoMaximo,
            CancellationToken cancellationToken);
        Task<Paralelo?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<Paralelo> AddAsync(Paralelo paralelo, CancellationToken cancellationToken);
        Task<Paralelo> UpdateAsync(Paralelo paralelo, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
