namespace AMMI_Online_API.Application.DTOs.Person;

public class CreateDocenteDTO
{
    public int IdTipoDocumento { get; set; }
    public string Documento { get; set; } = string.Empty;
    public int IdGenero { get; set; }
    public string PrimerNombre { get; set; } = string.Empty;
    public string? SegundoNombre { get; set; }
    public string PrimerApellido { get; set; } = string.Empty;
    public string? SegundoApellido { get; set; }
    public string Email { get; set; } = string.Empty;
}
