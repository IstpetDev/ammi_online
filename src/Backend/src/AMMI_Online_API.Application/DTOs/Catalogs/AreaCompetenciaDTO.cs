namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record AreaCompetenciaDTO
{
    public int IdAreaCompetencia { get; set; }
    public string Detalle { get; set; }
    public int IdArea { get; set; }
}

public record CreateAreaCompetenciaDTO
{
    public string Detalle { get; set; }
    public int IdArea { get; set; }
}

public record UpdateAreaCompetenciaDTO
{
    public int IdAreaCompetencia { get; set; }
    public string Detalle { get; set; }
    public int IdArea { get; set; }
}
