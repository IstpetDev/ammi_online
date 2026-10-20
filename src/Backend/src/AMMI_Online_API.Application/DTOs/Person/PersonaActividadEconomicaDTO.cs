namespace AMMI_Online_API.Application.DTOs.Person;

public record PersonaActividadEconomicaDTO
{
    public int IdPersonaActividadEconomica { get; set; }
    public int IdPersona { get; set; }
    public int IdTipoActividadEconomica { get; set; }
    public decimal? Valor { get; set; }
    public bool EsPrincipal { get; set; }
    public bool Activo { get; set; }
}

public record CreatePersonaActividadEconomicaDTO
{
    public int IdPersona { get; set; }
    public int IdTipoActividadEconomica { get; set; }
    public decimal? Valor { get; set; }
    public bool EsPrincipal { get; set; }
    public bool Activo { get; set; }
}

public record UpdatePersonaActividadEconomicaDTO
{
    public int IdPersonaActividadEconomica { get; set; }
    public int IdPersona { get; set; }
    public int IdTipoActividadEconomica { get; set; }
    public decimal? Valor { get; set; }
    public bool EsPrincipal { get; set; }
    public bool Activo { get; set; }
}
