using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface IEstudianteBeneficioRepository
{
    Task<EstudianteBeneficio?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<EstudianteBeneficio>> GetByAlumnoAsync(int idPersona, CancellationToken cancellationToken);
    Task<IEnumerable<EstudianteBeneficio>> GetActivosByAlumnoCicloAsync(int idPersona, int idCiclo, CancellationToken cancellationToken);
    Task<EstudianteBeneficio> AddAsync(EstudianteBeneficio entity, CancellationToken cancellationToken);
    Task<EstudianteBeneficio> UpdateAsync(EstudianteBeneficio entity, CancellationToken cancellationToken);
    Task<EstudianteBeneficio> AsignarBeneficioConAplicacionAsync(
    EstudianteBeneficio entity,
    Beneficio beneficio,
    CancellationToken cancellationToken);
    Task<bool> DesactivarBeneficioConReversionAsync(EstudianteBeneficio entity, CancellationToken cancellationToken);
}
