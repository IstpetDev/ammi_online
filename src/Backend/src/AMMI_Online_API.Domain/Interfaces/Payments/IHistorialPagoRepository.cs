using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface IHistorialPagoRepository
{
    Task<(IEnumerable<Pago> Items, int TotalCount)> GetHistorialPagosPagedAsync(
        string? documento,
        int? idMatricula,
        DateOnly? fechaDesde,
        DateOnly? fechaHasta,
        bool? esValidado,
        string? estadoPago = null,
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<Pago>> GetHistorialPagosAsync(
        string? documento,
        int? idMatricula,
        DateOnly? fechaDesde,
        DateOnly? fechaHasta,
        bool? esValidado,
        string? estadoPago = null,
        int? limite = null,
        CancellationToken cancellationToken = default);
}
