using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface IEspecieCicloRepository
{
    Task<IEnumerable<EspecieCiclo>> GetAllAsync(CancellationToken cancellationToken);

    Task<IEnumerable<EspecieCiclo>> GetByMallaAsync(int idMalla, CancellationToken cancellationToken);

    Task<EspecieCiclo?> GetByIdAsync(int idEspecieCiclo, CancellationToken cancellationToken);

    Task<bool> ExisteEspecieEnMallaAsync(int idMalla, int idEspecie, CancellationToken cancellationToken);

    Task<bool> EsMallaConCicloActivoAsync(int idMalla, CancellationToken cancellationToken);

    Task<EspecieCiclo> CreateAsync(EspecieCiclo especieCiclo, CancellationToken cancellationToken);

    Task<EspecieCiclo> UpdateValorAsync(int idEspecieCiclo, int idEspecie, decimal valorEspecie, CancellationToken cancellationToken);
}
