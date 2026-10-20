namespace AMMI_Online_API.Application.DTOs.Person;

public record ParentescoDTO
{
    public int IdParentesco { get; set; }
    public int IdPersonaOrigen { get; set; }
    public int IdPersonaDestino { get; set; }
    public int IdTipoParentesco { get; set; }
    public bool Representante { get; set; }
    public bool Tutor { get; set; }
    public bool ResponsableFinciero { get; set; }
    public bool ConviveAlumno { get; set; }
}

public record CreateParentescoDTO
{
    public int IdPersonaOrigen { get; set; }
    public int IdPersonaDestino { get; set; }
    public int IdTipoParentesco { get; set; }
    public bool Representante { get; set; }
    public bool Tutor { get; set; }
    public bool ResponsableFinciero { get; set; }
    public bool ConviveAlumno { get; set; }
}

public record UpdateParentescoDTO
{
    public int IdParentesco { get; set; }
    public int IdPersonaOrigen { get; set; }
    public int IdPersonaDestino { get; set; }
    public int IdTipoParentesco { get; set; }
    public bool Representante { get; set; }
    public bool Tutor { get; set; }
    public bool ResponsableFinciero { get; set; }
    public bool ConviveAlumno { get; set; }
}
