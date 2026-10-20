namespace AMMI_Online_API.Application.DTOs.Segurity;
public record UsuarioDTO
{
    public string Username { get; set; }
    public string Contrasenia { get; set; }
}

public record UsuarioCreateDTO
{
    public int IdPersona { get; set; }
    public string Username { get; set; }
    public string Contrasenia { get; set; }
}
public record UsuarioUpdateDTO
{
    public int IdPersona { get; set; }
    public string Username { get; set; }
    public string Contrasenia { get; set; }
}

