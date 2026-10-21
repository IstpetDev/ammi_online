namespace AMMI_Online_API.Application.DTOs.Catalogs;

public class EstadoPagoDTO
{
    public int IdEstadoPago { get; set; }
    public string Detalle { get; set; }
    public bool EsCancelado { get; set; }

}

public class CreateEstadoPagoDTO
{
    public string Detalle { get; set; }
    public bool EsCancelado { get; set; }
}

public class UpdateEstadoPagoDTO
{
    public int IdEstadoPago { get; set; }
    public string Detalle { get; set; }
    public bool EsCancelado { get; set; }
}


