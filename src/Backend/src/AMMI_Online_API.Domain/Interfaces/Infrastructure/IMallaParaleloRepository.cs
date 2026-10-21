using AMMI_Online_API.Domain.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Domain.Interfaces.Infrastructure
{
    public interface IMallaParaleloRepository
    {
        Task<MallaParalelo?> GetByIdAsync(int id, CancellationToken ct);
        Task<IEnumerable<MallaParalelo>> GetByMallaAsync(int idMalla, CancellationToken ct);
        Task UpdateAsync(MallaParalelo entity, CancellationToken ct);
        Task<bool> ExistsAsync(int id, CancellationToken ct);
        Task<int> CountActivosByMallaAsync(int idMalla, CancellationToken ct);
        Task<bool> TieneAlumnosActivosAsync(int idMallaParalelo, CancellationToken ct);
        Task<MallaParalelo> AddAsync(MallaParalelo entity, CancellationToken ct);
    }
}
