namespace AMMI_Online_API.Application.DTOs.Payments
{
    public class PagoDTO
    {
        public int IdPago { get; set; }
        public int IdTipoPago { get; set; }
        public string TipoPagoDetalle { get; set; } = string.Empty;
        public DateTime FechaPago { get; set; }
        public decimal ValorPago { get; set; }
        public DateTime FechaDeposito { get; set; }
        public int IdCuentaBancaria { get; set; }
        public string NumeroDeposito { get; set; } = string.Empty;
        public string RucCliente { get; set; } = string.Empty;
        public string Observaciones { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; }
        public bool? EsValidado { get; set; }

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