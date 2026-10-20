namespace AMMI_Online_API.Application.DTOs.Segurity;

public record ModuloOperacionDTO
{
    public int IdModuloOperacion { get; set; }
    public int IdModulo { get; set; }
    public int IdOperacion { get; set; }
    public bool EsActivo { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public record ModuloOperacionCreateDTO
{
    public int IdModulo { get; set; }
    public int IdOperacion { get; set; }
    public bool EsActivo { get; set; }
}

public record ModuloOperacionUpdateDTO
{
    public int IdModuloOperacion { get; set; }
    public int IdModulo { get; set; }
    public int IdOperacion { get; set; }
    public bool EsActivo { get; set; }
}
