namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record ParaleloDTO
{
    public int IdParalelo { get; set; }
    public string Detalle { get; set; }
    public int? Orden { get; set; }
}

public record ParaleloCreateDTO
{
    public string Detalle { get; set; }
    public int? Orden { get; set; }
}
public record ParaleloUpdateDTO
{
    public string Detalle { get; set; }
    public int? Orden { get; set; }
}
