namespace AMMI_Online_API.Application.DTOs.Payments;

public class CreditoDTO
{
    public int IdCredito { get; set; }
    public int IdMatricula { get; set; }
    public int IdEspecieCiclo { get; set; }

    // Campos de Credito
    public decimal MontoOriginal { get; set; }
    public decimal? MontoBeneficio { get; set; }
    public decimal? MontoFinal { get; set; }
    public decimal SaldoPendiente { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateOnly? FechaGeneracion { get; set; }

    // Datos de EspecieCiclo
    public decimal ValorEspecie { get; set; }

    // Datos de Especie
    public int IdEspecie { get; set; }
    public string DetalleEspecie { get; set; } = string.Empty;
    public bool EsDiferible { get; set; }
    public bool EsPension { get; set; }
    public bool EsMatricula { get; set; }

    // Detalle de créditos (cuotas)
    public List<DetalleCreditoItemDTO> DetallesCredito { get; set; } = new();
}

public class DetalleCreditoItemDTO
{
    public int IdDetalleCredito { get; set; }
    public int NumeroCuota { get; set; }
    public decimal? Valor { get; set; }
    public decimal? ValorCancelado { get; set; }
    public decimal? ValorOriginal { get; set; }
    public decimal? SaldoCuota { get; set; }
    public DateOnly? FechaLimite { get; set; }
    public string Estado { get; set; } = string.Empty;
    public bool Pagado { get; set; }
}


public class DiferirCreditoDTO
{
    public int IdCredito { get; set; }
    public int NumeroCuotas { get; set; }
}

public class DiferirCreditoResultDTO
{
    public int IdCredito { get; set; }
    public int NumeroCuotas { get; set; }
    public decimal ValorPorCuota { get; set; }
    public List<CuotaGeneradaDTO> DetallesGenerados { get; set; } = new();
}

public class CuotaGeneradaDTO
{
    public int Numero { get; set; }
    public decimal Valor { get; set; }
    public DateOnly FechaLimite { get; set; }
}

public class ActualizarFechaLimiteCuotaDTO
{
    public DateOnly NuevaFechaLimite { get; set; }
}
