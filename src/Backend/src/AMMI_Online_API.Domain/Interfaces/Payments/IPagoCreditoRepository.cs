using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface IPagoCreditoRepository
{
    /// <summary>
    /// Crea un pago sin cuotas asociadas (solo registro básico).
    /// </summary>
    Task<int> CrearPagoAsync(Pago pago, CancellationToken cancellationToken);

    /// <summary>
    /// Crea un pago no validado, registra las cuotas asociadas y cambia su estado a PENDIENTE_APROBACION.
    /// </summary>
    /// <param name="pago">Entidad pago (con EsValidado = false).</param>
    /// <param name="cuotas">Lista de cuotas a asociar (generalmente con ValorAplicado = 0).</param>
    Task<int> CrearPagoPendienteAsync(Pago pago, List<PagoCuota> cuotas, CancellationToken cancellationToken);

    /// <summary>
    /// Valida un pago existente (previamente creado como pendiente) y aplica la distribución del monto.
    /// Si se proporcionan cuotasSolicitud, reemplaza las existentes; de lo contrario usa las actuales.
    /// </summary>
    /// <param name="idPago">Identificador del pago a validar.</param>
    /// <param name="cuotasSolicitud">Lista opcional de cuotas para reemplazar las existentes.</param>
    /// <param name="distribuirExcedente">Indica si el excedente no asignado debe distribuirse automáticamente entre otras cuotas pendientes.</param>
    Task AplicarDistribucionAPagoAsync(int idPago, List<PagoCuota>? cuotasSolicitud, bool distribuirExcedente, CancellationToken cancellationToken);

    /// <summary>
    /// Crea un pago validado directamente, con distribución inmediata del monto entre las cuotas especificadas.
    /// </summary>
    /// <param name="pago">Entidad pago (con EsValidado = true).</param>
    /// <param name="cuotasSolicitud">Lista de cuotas a las que se aplicará el pago (pueden tener ValorAplicado = 0 para distribución automática).</param>
    /// <param name="distribuirExcedente">Indica si el excedente debe distribuirse automáticamente.</param>
    Task<int> CrearPagoConDistribucionAsync(Pago pago, List<PagoCuota> cuotasSolicitud, bool distribuirExcedente, CancellationToken cancellationToken);
}