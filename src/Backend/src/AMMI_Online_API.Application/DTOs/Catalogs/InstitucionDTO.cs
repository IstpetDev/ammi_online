namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record InstitucionDTO
{
    public int IdInstitucion { get; set; }
    public string Detalle { get; set; }
    public string RepresentanteLegal { get; set; }
    public string Ruc { get; set; }
    public int? IdAdjunto { get; set; }
}

public record InstitucionCreateDTO
{
    public string Detalle { get; set; }
    public string RepresentanteLegal { get; set; }
    public string Ruc { get; set; }
    public int? IdAdjunto { get; set; }
}
public record InstitucionUpdateDTO
{
    public int IdInstitucion { get; set; }
    public string Detalle { get; set; }
    public string RepresentanteLegal { get; set; }
    public string Ruc { get; set; }
    public int? IdAdjunto { get; set; }
}

