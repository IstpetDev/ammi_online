namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record ParaleloDTO
{
    public int IdParalelo { get; set; }
    public string NombreParalelo { get; set; }
    public int IdTipoJornada { get; set; }
    public int? CupoMaximo { get; set; }
}

public record ParaleloCreateDTO
{
    public string NombreParalelo { get; set; }
    public int IdTipoJornada { get; set; }
    public int? CupoMaximo { get; set; }
}
public record ParaleloUpdateDTO
{
    public string NombreParalelo { get; set; }
    public int IdTipoJornada { get; set; }
    public int? CupoMaximo { get; set; }
}
