using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface ICreditoBeneficioRepository
{
    Task AddAsync(CreditoBeneficio entity, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int idEstudianteBeneficio, int idCredito, CancellationToken cancellationToken);
}
