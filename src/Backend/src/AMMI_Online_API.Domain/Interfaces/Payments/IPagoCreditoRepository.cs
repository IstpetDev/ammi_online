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
    /// <param name="aprobarPago">Si es true, cambia el estado del pago a APROBADO (id=2) dentro de la misma transacción. Solo funciona si el pago está en estado PENDIENTE.</param>
    /// <param name="usuarioAprueba">Identificador del usuario que aprueba el pago para fines de auditoría.</param>
    Task AplicarDistribucionAPagoAsync(int idPago, List<PagoCuota>? cuotasSolicitud, bool distribuirExcedente, CancellationToken cancellationToken, bool aprobarPago = false, int? usuarioAprueba = null);
   
    /// <summary>
    /// Crea un pago aprobado con distribución inmediata del monto entre las cuotas especificadas.
    /// </summary>
    Task<int> CrearPagoConDistribucionAsync(Pago pago, List<PagoCuota> cuotasSolicitud, bool distribuirExcedente, CancellationToken cancellationToken);

    /// <summary>
    /// Cancela un pago existente: cambia su estado a cancelado, registra fecha y usuario de eliminación,
    /// y revierte los efectos en las cuotas (restaura saldos y actualiza estado de las cuotas).
    /// </summary>
    Task CancelarPagoAsync(int idPago, int usuarioElimino, string Observaciones, CancellationToken cancellationToken);

    /// <summary>
    /// Crea un pago en estado PENDIENTE (id_estado_pago = 1) con las cuotas asociadas,
    /// SIN aplicar distribución ni modificar saldos. La distribución se aplicará al aprobar.
    /// </summary>
    Task<int> CrearPagoPendienteSinDistribucionAsync(Pago pago, List<PagoCuota> cuotas, CancellationToken cancellationToken);

    /// <summary>
    /// Aprueba un pago pendiente: cambia su estado a APROBADO (id_estado_pago = 2) y registra la auditoría.
    /// </summary>
    Task AprobarPagoAsync(int idPago, int? usuarioAprueba, CancellationToken cancellationToken);

    /// <summary>
    /// Rechaza un pago pendiente: cambia su estado a RECHAZADO (id_estado_pago = 3)
    /// y elimina las cuotas asociadas.
    /// </summary>
    Task RechazarPagoAsync(int idPago, string? observaciones, CancellationToken cancellationToken);

    /// <summary>
    /// Obtiene el pago con sus cuotas asociadas.
    /// </summary>
    Task<Pago?> ObtenerPagoConCuotasAsync(int idPago, CancellationToken cancellationToken);

    /// <summary>
    /// Actualiza la observación de un pago existente.
    /// </summary>
    Task ActualizarObservacionAsync(int idPago, string? observaciones, CancellationToken cancellationToken);

    /// <summary>
    /// Obtiene el pago con todos los detalles necesarios para notificaciones (cliente, cuotas, créditos, persona, contactos, banco).
    /// </summary>
    Task<Pago?> ObtenerPagoConDetallesCompletosAsync(int idPago, CancellationToken cancellationToken);
}