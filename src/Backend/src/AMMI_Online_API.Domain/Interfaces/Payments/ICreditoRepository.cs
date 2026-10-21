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

    Task<DetalleCredito?> GetDetalleCreditoByIdAsync(
        int idDetalleCredito,
        CancellationToken cancellationToken);

    Task ActualizarFechaLimiteCuotaAsync(
        int idDetalleCredito,
        DateOnly nuevaFechaLimite,
        CancellationToken cancellationToken);

    Task UpdateDetallesCreditoAsync(IEnumerable<DetalleCredito> detalles, CancellationToken cancellationToken = default);

    Task<Credito> AsignarCreditoExtraAsync(int idMatricula, int idEspecie, decimal monto, DateOnly? fechaLimite, string? observaciones, CancellationToken cancellationToken);

    Task<(int TotalEvaluadas, int TotalAsignados, int TotalOmitidosDuplicados)> AsignarCreditoExtraMasivoAsync(List<int> idsMallas, int idEspecie, decimal monto, DateOnly? fechaLimite, string? observaciones, CancellationToken cancellationToken);

    Task<bool> AnularCreditoExtraAsync(int idCredito, CancellationToken cancellationToken);

    Task<IEnumerable<Credito>> GetCreditosExtrasAsync(int? idMatricula, CancellationToken cancellationToken);
}
