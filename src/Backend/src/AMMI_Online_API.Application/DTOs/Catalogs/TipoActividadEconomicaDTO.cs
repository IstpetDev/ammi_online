namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoActividadEconomicaDTO
{
    public int IdtipoActividadEconomica { get; set; }
    public string Nombre { get; set; }
    public bool EsFormal { get; set; }
}

public record CreateTipoActividadEconomicaDTO
{
    public string Nombre { get; set; }
    public bool EsFormal { get; set; }
}

public record UpdateTipoActividadEconomicaDTO
{
    public int IdtipoActividadEconomica { get; set; }
    public string Nombre { get; set; }
    public bool EsFormal { get; set; }
}
