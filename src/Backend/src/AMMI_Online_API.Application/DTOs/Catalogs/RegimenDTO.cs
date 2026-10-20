namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record RegimenDTO
{
    public int IdRegimen { get; set; }
    public string Detalle { get; set; }
}

public record RegimenCreateDTO
{
    public string Detalle { get; set; }
}

public record RegimenUpdateDTO
{
    public int IdRegimen { get; set; }
    public string Detalle { get; set; }
}
