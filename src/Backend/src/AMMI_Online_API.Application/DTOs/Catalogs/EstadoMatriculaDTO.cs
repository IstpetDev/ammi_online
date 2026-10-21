namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record EstadoMatriculaDTO
{
    public int IdEstadoMatricula { get; init; }
    public string Detalle { get; init; } = string.Empty;
    public bool Completado { get; init; }
}
