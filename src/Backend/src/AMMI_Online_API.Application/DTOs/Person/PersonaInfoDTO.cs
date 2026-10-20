namespace AMMI_Online_API.Application.DTOs.Person;

public record PersonaInfoDTO
{
    public int IdPersona { get; set; }
    public DateOnly? FechaNacimiento { get; set; }
    public int? IdEstadoCivil { get; set; }
    public int? IdNacionalidadEtnica { get; set; }
    public int? IdTipoSangre { get; set; }
}

public record CreatePersonaInfoDTO
{
    public int IdPersona { get; set; }
    public DateOnly? FechaNacimiento { get; set; }
    public int? IdEstadoCivil { get; set; }
    public int? IdNacionalidadEtnica { get; set; }
    public int? IdTipoSangre { get; set; }
}

public record UpdatePersonaInfoDTO
{
    public int IdPersona { get; set; }
    public DateOnly? FechaNacimiento { get; set; }
    public int? IdEstadoCivil { get; set; }
    public int? IdNacionalidadEtnica { get; set; }
    public int? IdTipoSangre { get; set; }
}
