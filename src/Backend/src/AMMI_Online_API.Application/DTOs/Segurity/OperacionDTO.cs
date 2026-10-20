namespace AMMI_Online_API.Application.DTOs.Segurity;

public record OperacionDTO
{
    public int IdOperacion { get; set; }
    public string Detalle { get; set; }
}

public record OperacionCreateDTO
{
    public string Detalle { get; set; }
}

public record OperacionUpdateDTO
{
    public int IdOperacion { get; set; }
    public string Detalle { get; set; }
}
