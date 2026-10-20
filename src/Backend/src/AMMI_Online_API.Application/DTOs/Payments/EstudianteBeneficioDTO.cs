namespace AMMI_Online_API.Application.DTOs.Payments;

public record EstudianteBeneficioDTO
{
    public int IdEstudianteBeneficio { get; init; }
    public int IdPersona { get; init; }
    public int IdBeneficio { get; init; }
    public string DetalleBeneficio { get; init; } = string.Empty;
    public string TipoValor { get; init; } = string.Empty;
    public decimal Valor { get; init; }
    public int? IdCiclo { get; init; }
    public DateTime FechaAsignacion { get; init; }
    public DateOnly FechaInicio { get; init; }
    public DateOnly? FechaFin { get; init; }
    public int? IdAprobadoPor { get; init; }
    public string? Observaciones { get; init; }
    public bool Activo { get; init; }
}

public record EstudianteBeneficioCreateDTO
{
    public int IdPersona { get; init; }
    public int IdBeneficio { get; init; }
    public int? IdCiclo { get; init; }
    public DateOnly FechaInicio { get; init; }
    public DateOnly? FechaFin { get; init; }
    public int? IdAprobadoPor { get; init; }
    public string? Observaciones { get; init; }
}

public record EstudianteBeneficioDesactivarDTO
{
    public int IdEstudianteBeneficio { get; init; }
    public string? Observaciones { get; init; }
}
