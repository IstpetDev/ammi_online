namespace AMMI_Online_API.Application.DTOs.Segurity;

public record RolUsuarioDTO
{
    public int IdRolUsuario { get; set; }
    public int IdRol { get; set; }
    public int IdPersona { get; set; }
}

public record RolUsuarioCreateDTO
{
    public int IdRol { get; set; }
    public int IdPersona { get; set; }
}

public record RolUsuarioUpdateDTO
{
    public int IdRolUsuario { get; set; }
    public int IdRol { get; set; }
    public int IdPersona { get; set; }
}
