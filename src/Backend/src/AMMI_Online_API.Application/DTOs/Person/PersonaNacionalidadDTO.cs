namespace AMMI_Online_API.Application.DTOs.Person;

public record PersonaNacionalidadDTO
{
    public int IdPersonaNacionalidad { get; set; }
    public int IdPersona { get; set; }
    public int IdPais { get; set; }
    public string Nacio { get; set; }
}

public record CreatePersonaNacionalidadDTO
{
    public int IdPersona { get; set; }
    public int IdPais { get; set; }
    public string Nacio { get; set; }
}

public record UpdatePersonaNacionalidadDTO
{
    public int IdPersonaNacionalidad { get; set; }
    public int IdPais { get; set; }
    public string Nacio { get; set; }
}
