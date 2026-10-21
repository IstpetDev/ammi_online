using Microsoft.AspNetCore.Http;

namespace AMMI_Online_API.Application.DTOs.Payments;

public class CreatePagoDTO
{
    public int IdTipoPago { get; set; }
    public DateTime FechaPago { get; set; }
    public decimal ValorPago { get; set; }
    public int? IdCliente { get; set; }
    public DateTime FechaDeposito { get; set; }
    public int IdCuentaBancaria { get; set; }
    public string NumeroDeposito { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; }
    public IFormFile Comprobante { get; set; }
    public DateTime? FechaEliminacion { get; set; }
    public int UsuarioRegistro { get; set; }
    public List<PagoCuotaItem> Cuotas { get; set; } = new();
}

public class PagoCuotaItem
{
    public int IdDetalleCredito { get; set; }
    public decimal? ValorAplicado { get; set; } // null indica que se asignará con el excedente
}