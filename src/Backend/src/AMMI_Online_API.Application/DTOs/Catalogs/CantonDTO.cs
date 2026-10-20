namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record CantonDTO
{
    public int IdCanton { get; set; }
    public string Nombre { get; set; }
    public int IdProvincia { get; set; }
}

public record CreateCantonDTO
{
    public required string Nombre { get; set; }
    public required int IdProvincia { get; set; }
}

public record UpdateCantonDTO
{
    public required int IdCanton { get; set; }
    public required string Nombre { get; set; }
    public required int IdProvincia { get; set; }
}
