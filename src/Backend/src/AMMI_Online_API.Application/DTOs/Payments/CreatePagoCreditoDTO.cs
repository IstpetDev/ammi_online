namespace AMMI_Online_API.Application.DTOs.Payments;

public class CreatePagoDTO
{
    public int IdTipoPago { get; set; }
    public DateTime FechaPago { get; set; }
    public decimal ValorPago { get; set; }
    public DateTime FechaDeposito { get; set; }
    public int IdCuentaBancaria { get; set; }
    public string NumeroDeposito { get; set; } = string.Empty;
    public string RucCliente { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
    public bool? EsValidado { get; set; } // null = Registrado, true = Validado, false = Anulado

    public List<PagoCuotaItem> Cuotas { get; set; } = new();
}

public class PagoCuotaItem
{
    public int IdDetalleCredito { get; set; }
    public decimal? ValorAplicado { get; set; } // null indica que se asignará con el excedente
}