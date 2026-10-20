namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoEstadoAprobacionDTO
{
    public int IdTipoEstadoAprobacion { get; set; }
    public string Detalle { get; set; }
}

public record TipoEstadoAprobacionCreateDTO
{
    public string Detalle { get; set; }
}

public record TipoEstadoAprobacionUpdateDTO
{
    public int IdTipoEstadoAprobacion { get; set; }
    public string Detalle { get; set; }
}
