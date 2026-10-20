namespace AMMI_Online_API.Application.DTOs.Postulations;

public class CambiarEstadoResultDTO
{
    public int FilasAfectadas { get; set; }
    public bool UsuarioCreado { get; set; }
    public bool MatriculaCreada { get; set; }
    public int? IdMatricula { get; set; }
    public int CreditosGenerados { get; set; }
    public int DetallesCreditoGenerados { get; set; }
    public string? MensajeUsuario { get; set; }
}
