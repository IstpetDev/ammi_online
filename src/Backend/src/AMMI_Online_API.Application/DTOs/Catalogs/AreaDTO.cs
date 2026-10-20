namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record AreaDTO
{
    public int IdArea { get; set; }
    public string Detalle { get; set; }
}

public record CreateAreaDTO
{
    public string Detalle { get; set; }
}

public record UpdateAreaDTO
{
    public int IdArea { get; set; }
    public string Detalle { get; set; }
}
