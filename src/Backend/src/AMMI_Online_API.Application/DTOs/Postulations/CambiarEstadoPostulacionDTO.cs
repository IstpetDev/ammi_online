namespace AMMI_Online_API.Application.DTOs.Postulations;

public record CambiarEstadoPostulacionDTO
{
    public int IdPostulacion { get; init; }
    public int IdTipoEstadoAprobacion { get; init; }
    public string? ObservacionesRevision { get; init; }
    public int IdEvaluador { get; init; }
}
