using System;

namespace AMMI_Online_API.Application.DTOs.Postulations;

public class ActualizarDatosBasicosPostulanteDTO
{
    public int? IdPersona { get; set; }
    public string PrimerNombre { get; set; } = string.Empty;
    public string? SegundoNombre { get; set; }
    public string PrimerApellido { get; set; } = string.Empty;
    public string? SegundoApellido { get; set; }
    public string Documento { get; set; } = string.Empty;
    public DateTime? FechaNacimiento { get; set; }
    public int? IdGenero { get; set; }
}
