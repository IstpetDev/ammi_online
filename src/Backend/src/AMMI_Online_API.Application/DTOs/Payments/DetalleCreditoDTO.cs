namespace AMMI_Online_API.Application.DTOs.Payments
{
    public class DetalleCreditoDTO
    {
        public int IdDetalleCredito { get; set; }
        public int IdCredito { get; set; }
        public int NumeroCuota { get; set; }
        public decimal? ValorOriginal { get; set; }
        public decimal? SaldoCuota { get; set; }
        public DateOnly? FechaLimite { get; set; }
        public string Estado { get; set; } = string.Empty;
        public bool Pagado { get; set; }
    }
}
