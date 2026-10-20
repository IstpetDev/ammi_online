using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface IEspecieCicloRepository
{
    Task<IEnumerable<EspecieCiclo>> GetAllAsync(CancellationToken cancellationToken);

    Task<IEnumerable<EspecieCiclo>> GetByCicloAsync(int idCiclo, CancellationToken cancellationToken);

    Task<EspecieCiclo?> GetByIdAsync(int idEspecieCiclo, CancellationToken cancellationToken);

    Task<bool> ExisteEspecieEnCicloAsync(int idCiclo, int idEspecie, CancellationToken cancellationToken);

    Task<bool> EsCicloActivoAsync(int idCiclo, CancellationToken cancellationToken);

    Task<EspecieCiclo> CreateAsync(EspecieCiclo especieCiclo, CancellationToken cancellationToken);

    Task<EspecieCiclo> UpdateValorAsync(int idEspecieCiclo, decimal valorEspecie, CancellationToken cancellationToken);
}
