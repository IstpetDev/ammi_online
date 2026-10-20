namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record EstadoCivilDTO
{
    public int IdEstadoCivil { get; set; }
    public string Nombre { get; set; }
}

public record EstadoCivilCreateDTO
{
    public string Nombre { get; set; }
}

public record EstadoCivilUpdateDTO
{
    public int IdEstadoCivil { get; set; }
    public string Nombre { get; set; }
}
