namespace AMMI_Online_API.Application.DTOs.Payments;

public class ResumenAlumnoContabilidadDTO
{
    public int IdPersona { get; set; }
    public int IdMatricula { get; set; }
    public string Documento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string NombreCiclo { get; set; } = string.Empty;
    public string NombreCurso { get; set; } = string.Empty;
    public decimal SaldoPendiente { get; set; }
    public decimal SaldoAprobado { get; set; }
    public decimal SaldoPendienteAprobacion { get; set; }
}
