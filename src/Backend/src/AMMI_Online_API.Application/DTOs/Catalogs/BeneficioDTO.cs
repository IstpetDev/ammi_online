namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record BeneficioDTO
{
    public int IdBeneficio { get; init; }
    public string Detalle { get; init; } = string.Empty;
    public string TipoValor { get; init; } = string.Empty;
    public decimal Valor { get; init; }
    public int AplicaA { get; init; }
    public bool EsBeca { get; init; }
    public string? Descripcion { get; init; }
    public bool RequiereRenovacion { get; init; }
    public bool Activo { get; init; }
}

public record BeneficioCreateDTO
{
    public string Detalle { get; init; } = string.Empty;
    public string TipoValor { get; init; } = string.Empty;
    public decimal Valor { get; init; }
    public int AplicaA { get; init; }
    public bool EsBeca { get; init; }
    public string? Descripcion { get; init; }
    public bool RequiereRenovacion { get; init; }
    public bool Activo { get; init; }
}

public record BeneficioUpdateDTO
{
    public int IdBeneficio { get; init; }
    public string Detalle { get; init; } = string.Empty;
    public string TipoValor { get; init; } = string.Empty;
    public decimal Valor { get; init; }
    public int AplicaA { get; init; }
    public bool EsBeca { get; init; }
    public string? Descripcion { get; init; }
    public bool RequiereRenovacion { get; init; }
    public bool Activo { get; init; }
}
