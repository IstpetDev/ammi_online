namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record ProvinciaDTO
{
    public int IdProvincia { get; set; }
    public string Nombre { get; set; }
    public int IdPais { get; set; }
}

public record CreateProvinciaDTO
{
    public required string Nombre { get; set; }
    public required int IdPais { get; set; }
}

public record UpdateProvinciaDTO
{
    public required int IdProvincia { get; set; }
    public required string Nombre { get; set; }
    public required int IdPais { get; set; }
}
