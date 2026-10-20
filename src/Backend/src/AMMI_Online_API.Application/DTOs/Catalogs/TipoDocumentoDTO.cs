namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoDocumentoDTO
{
    public int IdTipoDocumento { get; set; }
    public string Nombre { get; set; }
}

public record CreateTipoDocumentoDTO
{
    public string Nombre { get; set; }
}

public record UpdateTipoDocumentoDTO
{
    public int IdTipoDocumento { get; set; }
    public string Nombre { get; set; }
}
