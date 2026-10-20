using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface IMateria
    {
        Task<IEnumerable<Materia>> FindAsync(
            int? idMateria,
            string? detalle,
            decimal? horasRequeridas,
            DateOnly? fechaCreacion,
            bool? esActivo,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken);
        Task<int> CountAsync(
            int? idMateria,
            string? detalle,
            decimal? horasRequeridas,
            DateOnly? fechaCreacion,
            bool? esActivo,
            CancellationToken cancellationToken);
        Task<Materia?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<Materia> AddAsync(Materia materia, CancellationToken cancellationToken);
        Task<Materia> UpdateAsync(Materia materia, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
