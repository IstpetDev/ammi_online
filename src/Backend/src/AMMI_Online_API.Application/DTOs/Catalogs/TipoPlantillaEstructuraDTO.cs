namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoPlantillaEstructuraDTO
{
    public int IdTipoPlantillaEstrucutra { get; set; }
    public string Detalle { get; set; }
}

public record TipoPlantillaEstructuraCreateDTO
{
    public string Detalle { get; set; }
}

public record TipoPlantillaEstructuraUpdateDTO
{
    public int IdTipoPlantillaEstrucutra { get; set; }
    public string Detalle { get; set; }
}
