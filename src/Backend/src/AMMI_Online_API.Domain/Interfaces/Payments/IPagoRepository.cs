using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface IPagoRepository
{
    /// <summary>
    /// Obtiene los pagos realizados por un cliente específico (quien paga), usando su documento.
    /// </summary>
    Task<IEnumerable<Pago>> GetByClienteDocumentoAsync(string documento, CancellationToken cancellationToken);

    /// <summary>
    /// Obtiene los pagos asociados a un alumno (estudiante) a través de su matrícula, usando el documento del alumno.
    /// </summary>
    Task<IEnumerable<Pago>> GetByAlumnoDocumentoAsync(string documento, CancellationToken cancellationToken);

    /// <summary>
    /// Obtiene los pagos asociados a una matrícula específica.
    /// </summary>
    Task<IEnumerable<Pago>> GetByMatriculaAsync(int idMatricula, CancellationToken cancellationToken);

    /// <summary>
    /// Obtiene los pagos no cancelados (estado diferente a cancelado y sin fecha eliminación).
    /// Puede filtrarse por matrícula, documento de cliente o documento de alumno.
    /// </summary>
    Task<IEnumerable<Pago>> GetPagosNoCanceladosAsync(int? idMatricula, string? documentoCliente, string? documentoAlumno, CancellationToken cancellationToken);
}