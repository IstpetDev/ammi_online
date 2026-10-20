namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoPagoDTO
{
    public int IdTipoPago { get; set; }
    public string Detalle { get; set; }
}

public record TipoPagoCreateDTO
{
    public string Detalle { get; set; }
}

public record TipoPagoUpdateDTO
{
    public int IdTipoPago { get; set; }
    public string Detalle { get; set; }
}
