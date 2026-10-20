using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface IHistorialPagoRepository
{
    Task<IEnumerable<Pago>> GetHistorialPagosAsync(
        string? documento,
        int? idMatricula,
        DateOnly? fechaDesde,
        DateOnly? fechaHasta,
        bool? esValidado,
        CancellationToken cancellationToken);
}