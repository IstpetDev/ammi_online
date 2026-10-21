using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface IEstadoPagoRepository
{
    Task<IEnumerable<EstadoPago>> GetAllAsync(
        int? idEstadoPago,
        string? detalle,
        bool? esCancelado,
        CancellationToken cancellationToken);

    Task<EstadoPago?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<EstadoPago> AddAsync(EstadoPago estadoPago, CancellationToken cancellationToken);
    Task<EstadoPago> UpdateAsync(EstadoPago estadoPago, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
