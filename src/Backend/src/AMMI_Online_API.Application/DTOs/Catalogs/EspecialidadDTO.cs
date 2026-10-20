namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record EspecialidadDTO
{
    public int IdEspecialidad { get; set; }
    public string Detalle { get; set; }
}

public record EspecialidadCreateDTO
{
    public string Detalle { get; set; }
}

public record EspecialidadUpdateDTO
{
    public int IdEspecialidad { get; set; }
    public string Detalle { get; set; }
}

