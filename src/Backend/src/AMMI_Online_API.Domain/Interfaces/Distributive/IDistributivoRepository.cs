using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Distributive
{
    public interface IDistributivoRepository
    {
        Task<Distributivo?> GetByIdAsync(int id, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetAllAsync(CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByDocenteAsync(int idPersona, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByParaleloAsync(int idParalelo, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByDetalleMallaAsync(int idDetalleMalla, CancellationToken ct);
        Task<Distributivo> AddAsync(Distributivo entity, CancellationToken ct);
        Task UpdateAsync(Distributivo entity, CancellationToken ct);
        Task DeleteAsync(int id, CancellationToken ct);
        Task<bool> ExistsAsync(int id, CancellationToken ct);

        // Consultas adicionales
        Task<IEnumerable<Distributivo>> GetByMallaAsync(int idMalla, CancellationToken ct);
        Task<IEnumerable<DetalleMalla>> GetDetalleMallaByMallaAsync(int idMalla, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByCicloAsync(int idCiclo, CancellationToken ct);

        // Paginadas
        Task<IEnumerable<Distributivo>> GetByMallaPagedAsync(int idMalla, int pageNumber, int pageSize, CancellationToken ct);
        Task<int> CountByMallaAsync(int idMalla, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByCicloPagedAsync(int idCiclo, int pageNumber, int pageSize, CancellationToken ct);
        Task<int> CountByCicloAsync(int idCiclo, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetAllWithDetailsAsync(CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByMallaWithDetailsAsync(int idMalla, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByDocenteWithDetailsAsync(int idPersona, CancellationToken ct);
        Task AddRangeAsync(IEnumerable<Distributivo> entities, CancellationToken ct);
        
        // Validaciones
        Task<bool> ExisteAsignacionAsync(int idDetalleMalla, int idParalelo, int? idExcluir, CancellationToken ct);
        Task<bool> ExisteAsignacionDocenteAsync(int idDetalleMalla, int idParalelo, int idPersona, CancellationToken ct);

        // Conteos
        Task<int> ContarAlumnosPorParaleloAsync(int idParalelo, CancellationToken ct);
        Task<int> ContarAsignacionesPorDocenteAsync(int idPersona, CancellationToken ct);

        // Docentes disponibles (usuarios con rol PROFESOR)
        Task<IEnumerable<(int IdPersona, string NombreCompleto, string Documento, int AsignacionesActuales)>> GetDocentesDisponiblesAsync(CancellationToken ct);
    }
}
