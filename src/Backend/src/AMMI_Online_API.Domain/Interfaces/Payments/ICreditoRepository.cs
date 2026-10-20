using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface ICreditoRepository
{
    Task<IEnumerable<Credito>> GetCreditosByMatriculaAsync(
        int idMatricula,
        CancellationToken cancellationToken);

    Task<IEnumerable<Credito>> GetCreditosSimpleByMatriculaAsync(
        int idMatricula,
        CancellationToken cancellationToken);

    Task<Credito?> GetCreditoByIdAsync(
        int idCredito,
        CancellationToken cancellationToken);

    Task<bool> TieneDetallesCreditoAsync(
        int idCredito,
        CancellationToken cancellationToken);

    Task<IEnumerable<DetalleCredito>> CrearDetallesCreditoAsync(
        IEnumerable<DetalleCredito> detalles,
        CancellationToken cancellationToken);
    Task UpdateCreditoAsync(Credito credito, CancellationToken cancellationToken);

    Task<IEnumerable<DetalleCredito>> GetDetallesCreditoByMatriculaAsync(
        int idMatricula,
        CancellationToken cancellationToken);

    Task<IEnumerable<DetalleCredito>> GetDetallesByCreditoAsync(
        int idCredito,
        CancellationToken cancellationToken);

    Task EliminarDetallesPendientesAsync(
        int idCredito,
        CancellationToken cancellationToken);

    Task ActualizarCreditoAsync(
        Credito credito,
        CancellationToken cancellationToken);
}
