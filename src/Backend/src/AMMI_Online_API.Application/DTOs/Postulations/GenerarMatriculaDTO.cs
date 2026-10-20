namespace AMMI_Online_API.Application.DTOs.Postulations;

public record GenerarMatriculaDTO
{
    public int IdPersona { get; init; }
    public int IdMalla { get; init; }
    public int IdParalelo { get; init; } = 1;
}

public class GenerarMatriculaResultDTO
{
    public bool UsuarioCreado { get; set; }
    public bool MatriculaCreada { get; set; }
    public int? IdMatricula { get; set; }
    public int CreditosGenerados { get; set; }
    public int DetallesCreditoGenerados { get; set; }
    public int DetallesMatriculaGenerados { get; set; }
    public bool CorreoEnviado { get; set; }
    public string? MensajeUsuario { get; set; }
}
