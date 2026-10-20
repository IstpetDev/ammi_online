using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface IPagoRepository
{
    Task<IEnumerable<Pago>> GetByDocumentoPersonaAsync(string documento, CancellationToken cancellationToken);
    Task<IEnumerable<Pago>> GetByMatriculaAsync(int idMatricula, CancellationToken cancellationToken);
    Task<IEnumerable<Pago>> GetPagosPendientesAsync(int? idMatricula, string? documento, CancellationToken cancellationToken);
}