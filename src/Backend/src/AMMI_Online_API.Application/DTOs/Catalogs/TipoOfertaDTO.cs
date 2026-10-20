namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoOfertaDTO
{
    public int IdtipoOferta { get; set; }
    public string Detalle { get; set; }
    public int Duracion { get; set; }
    public bool EsActivo { get; set; }
}

public record TipoOfertaCreateDTO
{
    public string Detalle { get; set; }
    public int Duracion { get; set; }
    public bool EsActivo { get; set; }
}

public record TipoOfertaUpdateDTO
{
    public int IdtipoOferta { get; set; }
    public string Detalle { get; set; }
    public int Duracion { get; set; }
    public bool EsActivo { get; set; }
}
