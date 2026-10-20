namespace AMMI_Online_API.Application.DTOs.Payments;

// Respuesta del GET (saldo + movimientos)
public class SaldoFavorDTO
{
    public int IdPersona { get; set; }
    public decimal Saldo { get; set; }
    public List<SaldoFavorMovimientoDTO> UltimosMovimientos { get; set; } = new();
}

public class SaldoFavorMovimientoDTO
{
    public int IdMovimiento { get; set; }
    public decimal Monto { get; set; }
    public string Concepto { get; set; } = string.Empty;
    public int? IdCredito { get; set; }
    public int? IdDetalleCredito { get; set; }
    public DateTime FechaMovimiento { get; set; }
}

// Request del POST /Aplicar
public class AplicarSaldoFavorRequestDTO
{
    public int IdPersona { get; set; }
    public int IdDetalleCredito { get; set; }
    public decimal Monto { get; set; }
}
