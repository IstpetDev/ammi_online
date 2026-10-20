namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoDatoContactoDTO
{
    public int IdTipoDatoContacto { get; set; }
    public string Detalle { get; set; }
    public bool EsObligatorio { get; set; }
}

public record CreateTipoDatoContactoDTO
{
    public string Detalle { get; set; }
    public bool EsObligatorio { get; set; }
}

public record UpdateTipoDatoContactoDTO
{
    public int IdTipoDatoContacto { get; set; }
    public string Detalle { get; set; }
    public bool EsObligatorio { get; set; }
}
