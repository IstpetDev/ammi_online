namespace AMMI_Online_API.Application.DTOs.Person;

public record PersonaAlergiasDTO
{
    public int IdPersonaAlergias { get; set; }
    public string Detalle { get; set; }
    public int IdTipoAlergia { get; set; }
    public int IdPersona { get; set; }
}

public record CreatePersonaAlergias
{
    public string Detalle { get; set; }
    public int IdTipoAlergia { get; set; }
    public int IdPersona { get; set; }
}

public record UpdatePersonaAlergias
{
    public int IdPersonaAlergias { get; set; }
    public string Detalle { get; set; }
    public int IdTipoAlergia { get; set; }
    public int IdPersona { get; set; }
}
