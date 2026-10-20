namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoDocumentoPersonalDTO
{
    public int IdTipoDocumentoPersonal { get; set; }
    public string Detalle { get; set; }
}

public record CreateTipoDocumentoPersonalDTO
{
    public string Detalle { get; set; }
}

public record UpdateTipoDocumentoPersonalDTO
{
    public int IdTipoDocumentoPersonal { get; set; }
    public string Detalle { get; set; }
}
