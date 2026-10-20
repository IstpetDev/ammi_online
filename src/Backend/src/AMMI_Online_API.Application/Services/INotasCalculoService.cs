using AMMI_Online_API.Application.DTOs.Notas;

namespace AMMI_Online_API.Application.Services;

public interface INotasCalculoService
{
    /// <summary>
    /// Calcula la nota de un nodo compuesto basandose en sus hijos
    /// </summary>
    Task<decimal?> CalcularNotaCompuestaAsync(
        int idPlantillaEstructura,
        int idDetalleMatricula,
        CancellationToken ct);

    Task PropagarCalculoAsync(
        int idPlantillaEstructura,
        int idDetalleMatricula,
        CancellationToken ct);

    Task RecalcularTodasAsync(
        int idDetalleMatricula,
        CancellationToken ct);

    Task<BoletinAlumnoDTO> GetBoletinAsync(
        int idMatricula,
        CancellationToken ct);

    Task<string> GetEstadoAprobacionAsync(
        int idPlantillaEstructura,
        int idDetalleMatricula,
        CancellationToken ct);

    /// <summary>
    /// Lee la nota del nodo raíz calculada en NotasAlumno, aplica la regla de recuperación
    /// y persiste NotaFinal y Aprobado en DetalleMatricula.
    /// </summary>
    Task SincronizarDetalleMatriculaAsync(int idDetalleMatricula, CancellationToken ct);
}
