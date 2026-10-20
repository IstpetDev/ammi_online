using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs
{
    public interface ICurso
    {
        Task<IEnumerable<Cursos>> FindAsync(
            int? idCursos,
            int? idEspecialidad,
            string? detalle,
            CancellationToken cancellationToken);
        Task<Cursos?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<Cursos> AddAsync(Cursos curso, CancellationToken cancellationToken);
        Task<Cursos> UpdateAsync(Cursos curso, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
    }
}
