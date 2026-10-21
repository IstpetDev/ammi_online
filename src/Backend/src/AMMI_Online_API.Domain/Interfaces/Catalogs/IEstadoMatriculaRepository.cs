using AMMI_Online_API.Domain.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IEstadoMatriculaRepository
{
    Task<IEnumerable<EstadoMatricula>> GetAllAsync(CancellationToken ct);
    Task<EstadoMatricula?> GetByIdAsync(int id, CancellationToken ct);
    Task<bool> ExistsAsync(int id, CancellationToken ct);
}
