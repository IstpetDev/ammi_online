namespace AMMI_Online_API.Application.DTOs.Person;

public record PersonaDireccionDTO
{
    public int IdPersonaDireccion { get; set; }
    public int IdPersona { get; set; }
    public int IdParroquia { get; set; }
    public string DireccionDomiciliaria { get; set; }
    public bool Activo { get; set; }
}

public record CreatePersonaDireccionDTO
{
    public int IdPersona { get; set; }
    public int IdParroquia { get; set; }
    public string DireccionDomiciliaria { get; set; }
    public bool Activo { get; set; }
}

public record UpdatePersonaDireccionDTO
{
    public int IdPersonaDireccion { get; set; }
    public int IdParroquia { get; set; }
    public string DireccionDomiciliaria { get; set; }
    public bool Activo { get; set; }
}