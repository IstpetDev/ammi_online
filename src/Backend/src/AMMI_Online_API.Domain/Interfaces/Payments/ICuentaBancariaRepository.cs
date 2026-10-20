using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface ICuentaBancariaRepository
{
    Task<CuentaBancaria?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<CuentaBancaria>> GetAllAsync(
        int? idCuentaBancaria,
        int? idTipoCuenta,
        string? numeroCuenta,
        string? banco,
        bool? activo,
        CancellationToken cancellationToken);
    Task<CuentaBancaria> AddAsync(CuentaBancaria cuenta, CancellationToken cancellationToken);
    Task<CuentaBancaria> UpdateAsync(CuentaBancaria cuenta, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
