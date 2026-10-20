namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoReglaCalculoDTO
{
    public int IdTipoReglaCalculo { get; set; }
    public string Detalle { get; set; }
}

public record TipoReglaCalculoCreateDTO
{
    public string Detalle { get; set; }
}

public record TipoReglaCalculoUpdateDTO
{
    public int IdTipoReglaCalculo { get; set; }
    public string Detalle { get; set; }
}
