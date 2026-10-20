using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface IArea
    {
        Task<IEnumerable<Area>> FindAsync(
            int? idArea,
            string? detalle,
            CancellationToken cancellationToken);
        Task<Area?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<Area> AddAsync(Area area, CancellationToken cancellationToken);
        Task<Area> UpdateAsync(Area area, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
