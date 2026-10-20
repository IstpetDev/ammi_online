namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record ParroquiaDTO
{
    public int IdParroquia { get; set; }
    public string Nombre { get; set; }
    public int IdCanton { get; set; }
}

public record CreateParroquiaDTO
{
    public required string Nombre { get; set; }
    public required int IdCanton { get; set; }
}

public record UpdateParroquiaDTO
{
    public required int IdParroquia { get; set; }
    public required string Nombre { get; set; }
    public required int IdCanton { get; set; }
}
