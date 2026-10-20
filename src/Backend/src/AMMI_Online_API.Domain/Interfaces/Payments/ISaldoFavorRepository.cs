using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface ISaldoFavorRepository
{
    Task<SaldoFavorAlumno> GetOrCreateByPersonaAsync(int idPersona, CancellationToken cancellationToken);

    Task AplicarSaldoAsync(int idPersona, int idDetalleCredito, decimal monto, CancellationToken cancellationToken);

    Task<IEnumerable<SaldoFavorMovimiento>> GetMovimientosAsync(int idPersona, int limit, CancellationToken cancellationToken);

    Task AgregarSaldoAsync(int idPersona, decimal monto, string concepto, int? idCredito, CancellationToken cancellationToken);
}
