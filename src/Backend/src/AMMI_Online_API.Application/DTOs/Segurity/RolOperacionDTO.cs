namespace AMMI_Online_API.Application.DTOs.Segurity;

public record RolOperacionDTO
{
    public int IdRolOperacion { get; set; }
    public int IdModuloOperacion { get; set; }
    public int IdRol { get; set; }
    public bool EsActivo { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public record RolOperacionCreateDTO
{
    public int IdModuloOperacion { get; set; }
    public int IdRol { get; set; }
    public bool EsActivo { get; set; }
}

public record RolOperacionUpdateDTO
{
    public int IdRolOperacion { get; set; }
    public int IdModuloOperacion { get; set; }
    public int IdRol { get; set; }
    public bool EsActivo { get; set; }
}
