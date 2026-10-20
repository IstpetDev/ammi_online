using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface ICiclo
    {
        Task<IEnumerable<Ciclo>> FindAsync(
            int? idCiclo,
            int? idPadre,
            int? idPeriodo,
            int? idRegimen,
            string? detalle,
            DateOnly? fechaInicioEstimada,
            DateOnly? fechaFinEstimada,
            bool? EsActivo,
            CancellationToken cancellationToken);
        Task<Ciclo?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<Ciclo> AddAsync(Ciclo ciclo, CancellationToken cancellationToken);
        Task<Ciclo> UpdateAsync(Ciclo ciclo, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
