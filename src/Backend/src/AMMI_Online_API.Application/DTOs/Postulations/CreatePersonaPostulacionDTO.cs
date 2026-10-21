namespace AMMI_Online_API.Application.DTOs.Postulation;

public class CreatePersonaPostulacionDTO
{
    // Create Persona
    public int IdTipoDocumento { get; set; }
    public string Documento { get; set; }
    public int? IdGenero { get; set; }
    public string PrimerNombre { get; set; }
    public string? SegundoNombre { get; set; }
    public string PrimerApellido { get; set; }
    public string? SegundoApellido { get; set; }
    // Create PersonaInfo
    public DateOnly? FechaNacimiento { get; set; }
    // Create Provincia de donde se postula
    public int? IdProvincia { get; set; }
    // Postulación
    public int? IdMalla { get; set; }
    public bool EsPostulacionRapida { get; set; } = false;
    public string? ObservacionesPostulante { get; set; }
    public DatosContactoItem1[] DatosContactos { get; set; } = Array.Empty<DatosContactoItem1>();
}

public class DatosContactoItem1
{
    public int IdTipoDatoContacto { get; set; }
    public string Detalle { get; set; }
    public bool EsPrincipal { get; set; }
}
