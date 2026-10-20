
namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record EtniaDTO
{
    public int IdEtnia { get; set; }
    public string Nombre { get; set; }
    public bool? Default { get; set; }
}

public record EtniaCreateDTO
{
    public string Nombre { get; set; }
    public bool? Default { get; set; }
}
public record EtniaUpdateDTO
{
    public int IdEtnia { get; set; }
    public string Nombre { get; set; }
    public bool? Default { get; set; }
}

