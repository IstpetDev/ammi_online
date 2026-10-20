using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface IEspecialidad
    {
        Task<IEnumerable<Especialidad>> FindAsync(
            int? idEspecialidad,
            string? detalle,
            CancellationToken cancellationToken);
        Task<Especialidad?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<Especialidad> AddAsync(Especialidad especialidad, CancellationToken cancellationToken);
        Task<Especialidad> UpdateAsync(Especialidad especialidad, CancellationToken cancellationToken);
        Task<Especialidad> DeleteAsync(int id, CancellationToken cancellationToken);
    }
}
