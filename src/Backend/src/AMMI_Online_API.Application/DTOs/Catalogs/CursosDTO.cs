namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record CursosDTO
{
    public int IdCursos { get; set; }
    public int IdEspecialidad { get; set; }
    public string Detalle { get; set; }
}

public record CursosCreateDTO
{
    public int IdEspecialidad { get; set; }
    public string Detalle { get; set; }
}

public record CursosUpdateDTO
{
    public int IdCursos { get; set; }
    public int IdEspecialidad { get; set; }
    public string Detalle { get; set; }
}
