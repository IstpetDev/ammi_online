namespace AMMI_Online_API.Application.DTOs.Payments;

public class PagoHistorialDTO
{
    public int IdPago { get; set; }
    public DateTime FechaPago { get; set; }
    public decimal ValorPago { get; set; }
    public string? TipoPago { get; set; }
    public string EstadoPago { get; set; }
    public bool EsCancelado { get; set; }
    // Campos simples del crédito (resumen)
    public string? EstadoCredito { get; set; }
    public decimal TotalPagadoCredito { get; set; }
    public int NumeroCuotasPagadas { get; set; }
    // Datos del Cliente si es que posee
    public int IdCliente { get; set; }
    // Datos del alumno
    public string Documento { get; set; } = string.Empty;
    public string NumeroDeposito { get; set; }
    public string BancoDeposito { get; set; }
    public string PathComprobante { get; set; }
    public string AlumnoNombre { get; set; } = string.Empty;
    public int IdMatricula { get; set; }

    //Detalle de las cuotas pagadas en este pago
    public List<PagoCuotaHistorialDTO> CuotasPagadas { get; set; } = new();

    //Observaciones por si el pago fue Cancelado
    public string Observaciones { get; set; }

    // Datos de auditoría de aprobación
    public int? UsuarioAprueba { get; set; }
    public string? UsuarioApruebaNombre { get; set; }
    public DateTime? FechaAprobacion { get; set; }
}

public class PagoCuotaHistorialDTO
{
    public int IdPagoCuota { get; set; }
    public int IdDetalleCredito { get; set; }
    public int NumeroCuota { get; set; }
    public decimal ValorAplicado { get; set; }
    public decimal ValorOriginalCuota { get; set; }
    public decimal SaldoCuota { get; set; }
    public string EstadoCuota { get; set; } = string.Empty;

    // Información del crédito asociado
    public int IdCredito { get; set; }
    public string DetalleEspecie { get; set; } = string.Empty;
    public bool EsDiferible { get; set; }
}
