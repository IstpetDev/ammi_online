namespace AMMI_Online_API.Application.DTOs.Postulations;

public record CambiarEstadoPostulacionDTO
{
    public int IdPostulacion { get; init; }
    public int IdTipoEstadoAprobacion { get; init; }
    public string? ObservacionesRevision { get; init; }
    public int IdEvaluador { get; init; }

    /// <summary>
    /// Requerido cuando IdTipoEstadoAprobacion = 4 (Aprobado).
    /// Indica el paralelo al que se matriculará al estudiante.
    /// </summary>
    public int? IdMallaParalelo { get; init; }
}
