using AMMI_Online_API.Domain.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Domain.Interfaces.Postulations;

public interface IPostulacionRepository
{
    Task<IEnumerable<Postulacion>> GetPostulacionesByPersonaIdAsync(int idPersona, CancellationToken cancellationToken);
    Task<IEnumerable<Postulacion>> GetAllPostulacionesWithDetailsAsync(CancellationToken cancellationToken);
    Task<IEnumerable<Postulacion>> GetPostulacionesFilteredWithDetailsAsync(int? idCiclo, int? idMalla, int? idTipoEstadoAprobacion, string? search, CancellationToken cancellationToken);
    Task<Postulacion?> GetPostulacionByIdAsync(int idPostulacion, CancellationToken cancellationToken);
    Task<int> UpdateMallaAsync(int idPostulacion, int idMalla, CancellationToken cancellationToken);
    Task<bool> EliminarPostulacionAsync(int idPostulacion, CancellationToken cancellationToken);
    Task<bool> ActualizarDatosBasicosPostulanteAsync(
        int idPostulacion,
        string primerNombre,
        string? segundoNombre,
        string primerApellido,
        string? segundoApellido,
        string documento,
        System.DateTime? fechaNacimiento,
        int? idGenero,
        CancellationToken cancellationToken);
}
