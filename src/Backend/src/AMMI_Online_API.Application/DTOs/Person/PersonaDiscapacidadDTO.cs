using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.DTOs.Person;

public record PersonaDiscapacidadDTO
{
    public int IdPersonaDiscapacidad { get; set; }
    public int IdPersona { get; set; }
    public int Porcentaje { get; set; }
    public string Recomendaciones { get; set; }
    public int IdTipoDiscapacidad { get; set; }
    public int IdAdjunto { get; set; }
    public string? PathAdjunto { get; set; }
}

public record CreatePersonaDiscapacidadDTO
{
    public int IdPersona { get; set; }
    public int Porcentaje { get; set; }
    public string Recomendaciones { get; set; }
    public int IdTipoDiscapacidad { get; set; }
    public IFormFile Archivo { get; set; }
}

public record UpdatePersonaDiscapacidadDTO
{
    public int IdPersonaDiscapacidad { get; set; }
    public int Porcentaje { get; set; }
    public string Recomendaciones { get; set; }
    public int IdTipoDiscapacidad { get; set; }
    public IFormFile Archivo { get; set; }
}
