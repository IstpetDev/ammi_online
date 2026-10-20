using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoCuentaRepository
{
    Task<TipoCuenta?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoCuenta>> GetTipoCuenta(int? IdTipoCuenta, string? Detalle, CancellationToken cancellationToken);
    Task<TipoCuenta> AddSync(TipoCuenta tipoCuenta, CancellationToken cancellationToken);
    Task<TipoCuenta> UpdateAsync(TipoCuenta tipoCuenta, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExitsAsync(int id, CancellationToken cancellationToken);
}
