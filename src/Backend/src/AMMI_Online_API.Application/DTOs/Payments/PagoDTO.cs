namespace AMMI_Online_API.Application.DTOs.Payments
{
    public class PagoDTO
    {
        public int IdPago { get; set; }
        public int IdTipoPago { get; set; }
        public string TipoPagoDetalle { get; set; } = string.Empty;
        public int? IdCliente { get; set; }
        public string ClienteDocumento { get; set; } = string.Empty;
        public string ClienteNombre { get; set; } = string.Empty;
        public int IdEstadoPago { get; set; }
        public string EstadoPagoDetalle { get; set; } = string.Empty;
        public bool EsCancelado { get; set; }
        public DateTime FechaPago { get; set; }
        public decimal ValorPago { get; set; }
        public DateTime FechaDeposito { get; set; }
        public int IdCuentaBancaria { get; set; }
        public string NumeroDeposito { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; }
        public int UrlComprobante { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string Observaciones { get; set; }
        public int UsuarioRegistro { get; set; }
        public int? UsuarioElimino { get; set; }
        public int? UsuarioAprueba { get; set; }
        public DateTime? FechaAprobacion { get; set; }

        // Información de la matrícula (se obtiene de la primera cuota, asumiendo que todas pertenecen a la misma matrícula)
        public int IdMatricula { get; set; }

        // Detalle de las cuotas pagadas en este pago
        public List<PagoCuotaInfoDTO> CuotasAplicadas { get; set; } = new();
    }

    public class PagoCuotaInfoDTO
    {
        public int IdPagoCuota { get; set; }
        public int IdDetalleCredito { get; set; }
        public int NumeroCuota { get; set; }
        public decimal ValorAplicado { get; set; }
        public decimal SaldoCuota { get; set; }
        public string EstadoCuota { get; set; } = string.Empty;
        public int IdCredito { get; set; }
        public string DetalleEspecie { get; set; } = string.Empty;
    }
}