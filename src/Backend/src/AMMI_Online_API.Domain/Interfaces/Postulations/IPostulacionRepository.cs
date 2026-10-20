using AMMI_Online_API.Domain.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Domain.Interfaces.Postulations;

public interface IPostulacionRepository
{
    Task<IEnumerable<Postulacion>> GetPostulacionesByPersonaIdAsync(int idPersona, CancellationToken cancellationToken);
    Task<IEnumerable<Postulacion>> GetAllPostulacionesWithDetailsAsync(CancellationToken cancellationToken);
    Task<Postulacion?> GetPostulacionByIdAsync(int idPostulacion, CancellationToken cancellationToken);
    Task<int> UpdateMallaAsync(int idPostulacion, int idMalla, CancellationToken cancellationToken);
}
