namespace AMMI_Online_API.Domain.Entities;

public partial class DetalleCredito
{
    public int IdDetalleCredito { get; set; }
    
    public int IdCredito { get; set; }

    public int NumeroCuota { get; set; }

    public decimal? ValorOriginal { get; set; }

    public decimal? SaldoCuota { get; set; }

    public DateOnly? FechaLimite { get; set; }

    public string Estado { get; set; }

    public bool Pagado { get; set; }

    public virtual Credito IdCreditoNavigation { get; set; }

    public virtual ICollection<PagoCuota> PagoCuota { get; set; } = new List<PagoCuota>();
}