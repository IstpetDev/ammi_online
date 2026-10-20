using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface IPeriodoLectivo
    {
        Task<IEnumerable<PeriodoLectivo>> FindAsync(
            int? idPeriodoLectivo,
            string? detalle,
            DateOnly? fechaInicioEstimada,
            DateOnly? fechaFinEstimada,
            CancellationToken cancellationToken);
        Task<PeriodoLectivo?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<PeriodoLectivo> AddAsync(PeriodoLectivo periodoLectivo, CancellationToken cancellationToken);
        Task<PeriodoLectivo> UpdateAsync(PeriodoLectivo periodoLectivo, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
