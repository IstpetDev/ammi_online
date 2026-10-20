namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record TipoCuentaDTO
{
    public int IdTipoCuenta { get; set; }
    public string Detalle { get; set; }
}


public record CreateTipoCuentaDTO
{
    public string Detalle { get; set; }
}

public record UpdateTipoCuentaDTO
{
    public int IdTipoCuenta { get; set; }
    public string Detalle { get; set; }
}