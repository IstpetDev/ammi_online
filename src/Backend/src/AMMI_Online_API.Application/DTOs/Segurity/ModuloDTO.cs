namespace AMMI_Online_API.Application.DTOs.Segurity;

public record ModuloDTO
{
    public int IdModulo { get; set; }
    public string Detalle { get; set; }
}

public record ModuloCreateDTO
{
    public string Detalle { get; set; }
}

public record ModuloUpdateDTO
{
    public int IdModulo { get; set; }
    public string Detalle { get; set; }
}
