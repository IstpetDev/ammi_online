namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoDiscapacidadDTO
{
    public int IdTipoDiscapacidad { get; set; }
    public string Nombre { get; set; }
    public string Recomendaciones { get; set; }
}

public record CreateTipoDiscapacidadDTO
{
    public required string Nombre { get; set; }
    public required string Recomendaciones { get; set; }
}

public record UpdateTipoDiscapacidadDTO
{
    public required int IdTipoDiscapacidad { get; set; }
    public required string Nombre { get; set; }
    public required string Recomendaciones { get; set; }
}
