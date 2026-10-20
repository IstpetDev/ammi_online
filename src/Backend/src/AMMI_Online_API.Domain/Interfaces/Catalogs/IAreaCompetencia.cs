using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface IAreaCompetencia
    {
        Task<IEnumerable<AreaCompetencia>> FindAsync(
            int? idAreaCompetencia,
            int? idArea,
            string? detalle,
            CancellationToken cancellationToken);
        Task<AreaCompetencia?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<AreaCompetencia> AddAsync(AreaCompetencia areaCompetencia, CancellationToken cancellationToken);
        Task<AreaCompetencia> UpdateAsync(AreaCompetencia areaCompetencia, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
