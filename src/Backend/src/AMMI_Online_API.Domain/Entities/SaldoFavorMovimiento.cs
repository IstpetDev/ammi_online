namespace AMMI_Online_API.Domain.Entities;

public class SaldoFavorMovimiento
{
    public int IdMovimiento { get; set; }
    public int? IdSaldoFavor { get; set; }
    public decimal? Monto { get; set; }
    public string? Concepto { get; set; }
    public int? IdCredito { get; set; }
    public int? IdDetalleCredito { get; set; }
    public DateTime FechaMovimiento { get; set; }

    public virtual SaldoFavorAlumno? IdSaldoFavorNavigation { get; set; }
    public virtual Credito? IdCreditoNavigation { get; set; }
    public virtual DetalleCredito? IdDetalleCreditoNavigation { get; set; }
}
