namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record PaisDTO
{
    public int IdPais { get; set; }
    public string Nombre { get; set; }
    public string Nacionalidad { get; set; }
    public bool EsEcuador { get; set; }
}

public record CreatePaisDTO
{
    public required string Nombre { get; set; }
    public required string Nacionalidad { get; set; }
    public required bool EsEcuador { get; set; }
}

public record UpdatePaisDTO
{
    public required int IdPais { get; set; }
    public required string Nombre { get; set; }
    public required string Nacionalidad { get; set; }
    public required bool EsEcuador { get; set; }
}
