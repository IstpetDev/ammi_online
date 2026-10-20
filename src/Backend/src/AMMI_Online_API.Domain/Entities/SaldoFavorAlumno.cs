namespace AMMI_Online_API.Domain.Entities;

public class SaldoFavorAlumno
{
    public int IdSaldoFavor { get; set; }
    public int IdPersona { get; set; }
    public decimal? Saldo { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual Persona IdPersonaNavigation { get; set; } = null!;
    public virtual ICollection<SaldoFavorMovimiento> SaldoFavorMovimiento { get; set; } = new List<SaldoFavorMovimiento>();
}
