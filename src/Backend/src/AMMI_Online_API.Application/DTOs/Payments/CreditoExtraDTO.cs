namespace AMMI_Online_API.Application.DTOs.Payments;

public class AsignarCreditoExtraDTO
{
    public int IdMatricula { get; set; }
    public int IdEspecie { get; set; }
    public decimal Monto { get; set; }
    public DateOnly? FechaLimite { get; set; }
    public string? Observaciones { get; set; }
}

public class CreditoExtraItemDTO
{
    public int IdCredito { get; set; }
    public int IdMatricula { get; set; }
    public int IdDetalleCredito { get; set; }
    public string AlumnoNombre { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string Curso { get; set; } = string.Empty;
    public string Paralelo { get; set; } = string.Empty;
    public string Ciclo { get; set; } = string.Empty;
    public int IdEspecie { get; set; }
    public string EspecieDetalle { get; set; } = string.Empty;
    public decimal MontoOriginal { get; set; }
    public decimal SaldoPendiente { get; set; }
    public decimal ValorCancelado { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateOnly? FechaGeneracion { get; set; }
    public DateOnly? FechaLimite { get; set; }
    public bool Pagado { get; set; }
    public bool TienePagos { get; set; }
}

public class AsignarCreditoExtraMasivoDTO
{
    public List<int> IdsMallas { get; set; } = new();
    public int IdEspecie { get; set; }
    public decimal Monto { get; set; }
    public DateOnly? FechaLimite { get; set; }
    public string? Observaciones { get; set; }
}

public class AsignarCreditoExtraMasivoResultDTO
{
    public int TotalMatriculasEvaluadas { get; set; }
    public int TotalAsignados { get; set; }
    public int TotalOmitidosDuplicados { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}
