namespace AMMI_Online_API.Application.DTOs.Postulations;

public record DetalleMatriculaConAlumnoDTO
{
    public int IdDetalleMatricula { get; init; }
    public int IdMatricula { get; init; }
    public int IdDetalleMalla { get; init; }
    public string NombreAlumno { get; init; } = string.Empty;
    public string DocumentoAlumno { get; init; } = string.Empty;
}
