namespace AMMI_Online_API.Application.DTOs.Person;

public record PersonaDTO
{
    public int IdPersona { get; set; }
    public int IdTipoDocumento { get; set; }
    public string Documento { get; set; }
    public int IdGenero { get; set; }
    public string PrimerNombre { get; set; }
    public string SegundoNombre { get; set; }
    public string PrimerApellido { get; set; }
    public string SegundoApellido { get; set; }
    public bool Activo { get; set; }
}

public record CreatePersonaDTO
{
    public int IdTipoDocumento { get; set; }
    public string Documento { get; set; }
    public int IdGenero { get; set; }
    public string PrimerNombre { get; set; }
    public string SegundoNombre { get; set; }
    public string PrimerApellido { get; set; }
    public string SegundoApellido { get; set; }
    public bool Activo { get; set; }
}


public record UpdatePersonaDTO
{
    public int IdPersona { get; set; }
    public int IdTipoDocumento { get; set; }
    public string Documento { get; set; }
    public int IdGenero { get; set; }
    public string PrimerNombre { get; set; }
    public string SegundoNombre { get; set; }
    public string PrimerApellido { get; set; }
    public string SegundoApellido { get; set; }
    public bool Activo { get; set; }
}