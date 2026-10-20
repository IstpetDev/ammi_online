namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record NacionalidadEtnicaDTO
{
    public int IdnacionalidadEtnica { get; set; }
    public string Nombre { get; set; }
    public bool EsNinguna { get; set; }
    public int IdEtnia { get; set; }
}

public record CreateNacionalidadEtnicaDTO
{
    public string Nombre { get; set; }
    public bool EsNinguna { get; set; }
    public int IdEtnia { get; set; }
}

public record UpdateNacionalidadEtnicaDTO
{
    public int IdnacionalidadEtnica { get; set; }
    public string Nombre { get; set; }
    public bool EsNinguna { get; set; }
    public int IdEtnia { get; set; }
}
