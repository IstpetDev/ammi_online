using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface IRegimen
    {
        Task<IEnumerable<Regimen>> FindAsync(
            int? idRegimen,
            string? detalle,
            CancellationToken cancellationToken);
        Task<Regimen?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<Regimen> AddAsync(Regimen regimen, CancellationToken cancellationToken);
        Task<Regimen> UpdateAsync(Regimen regimen, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
