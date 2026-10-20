namespace AMMI_Online_API.Application.DTOs.Segurity;

public record RolDTO
{
    public int IdRol { get; set; }
    public string Detalle { get; set; }
}

public record RolCreateDTO
{
    public string Detalle { get; set; }
}
public record RolUpdateDTO
{
    public int IdRol { get; set; }
    public string Detalle { get; set; }
}
