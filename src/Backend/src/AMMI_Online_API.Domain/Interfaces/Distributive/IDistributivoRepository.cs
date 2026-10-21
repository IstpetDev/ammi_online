using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Distributive
{
    public interface IDistributivoRepository
    {
        Task<Distributivo?> GetByIdAsync(int id, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetAllAsync(CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByDocenteAsync(int idPersona, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByMallaParaleloAsync(int idMallaParalelo, CancellationToken ct);
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
        Task<bool> ExisteAsignacionAsync(int idDetalleMalla, int idMallaParalelo, int? idExcluir, CancellationToken ct);
        Task<bool> ExisteAsignacionDocenteAsync(int idDetalleMalla, int idMallaParalelo, int idPersona, CancellationToken ct);

        // Conteos
        Task<int> ContarAlumnosPorMallaParaleloAsync(int idMallaParalelo, CancellationToken ct);
        Task<int> ContarAsignacionesPorDocenteAsync(int idPersona, CancellationToken ct);

        // Docentes disponibles (usuarios con rol PROFESOR)
        Task<IEnumerable<(int IdPersona, string NombreCompleto, string Documento, int AsignacionesActuales, decimal TotalHoras, int TotalParalelos, int TotalAlumnos)>> GetDocentesDisponiblesAsync(CancellationToken ct);

        // Nuevos métodos PLAN_DISTRIBUTIVO
        Task<IEnumerable<Distributivo>> GetActivosByMallaParaleloAsync(int idMallaParalelo, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetSlotsSinDocenteByMallaAsync(int idMalla, CancellationToken ct);
        Task ClonarDistributivosAsync(int idOrigen, int idDestino, CancellationToken ct);
        Task DesactivarAsync(int idDistributivo, CancellationToken ct);
        Task<bool> TieneNotasAsync(int idDetalleMalla, int idMallaParalelo, CancellationToken ct);

        Task<IEnumerable<Distributivo>> GetFiltradoPagedAsync(int? idMalla, int? idMallaParalelo, int? idDetalleMalla, bool? soloActivos, int pageNumber, int pageSize, CancellationToken ct);
        Task<int> CountFiltradoAsync(int? idMalla, int? idMallaParalelo, int? idDetalleMalla, bool? soloActivos, CancellationToken ct);
        Task<IEnumerable<Distributivo>> GetByDocenteByDocumentoAsync(string documento, CancellationToken ct);
        Task<Distributivo?> GetByIdConAlumnosAsync(int id, CancellationToken ct);

        Task<IEnumerable<MallaParalelo>> GetMallaParalelosByCicloAsync(int idCiclo, CancellationToken ct);
    }
}
