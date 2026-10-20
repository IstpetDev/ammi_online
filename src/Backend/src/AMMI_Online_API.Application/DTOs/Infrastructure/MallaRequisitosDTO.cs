namespace AMMI_Online_API.Application.DTOs.Infrastructure;

/// <summary>
/// DTO para representar la relacion entre Malla y Requisitos
/// </summary>
public record MallaRequisitosDTO
{
    public int IdMallaRequisitos { get; init; }
    public int IdMalla { get; init; }
    public int IdRequisitos { get; init; }

    // Datos relacionados de Malla
    public string DetalleMalla { get; init; } = string.Empty;

    // Datos relacionados de Requisito
    public string DetalleRequisito { get; init; } = string.Empty;
    public bool EsObligatorio { get; init; }
    public bool BloqueaInscripcion { get; init; }
    public string TipoDato { get; init; } = string.Empty;
    public bool EsMayorEdad { get; init; }
}

/// <summary>
/// DTO para crear una relacion Malla-Requisito
/// </summary>
public record MallaRequisitosCreateDTO
{
    public int IdMalla { get; init; }
    public int IdRequisitos { get; init; }
}

/// <summary>
/// DTO para asignar multiples requisitos a una malla
/// </summary>
public record AsignarRequisitosAMallaDTO
{
    public int IdMalla { get; init; }
    public List<int> IdsRequisitos { get; init; } = new();
}

/// <summary>
/// DTO para reemplazar todos los requisitos de una malla
/// </summary>
public record ReemplazarRequisitosDTO
{
    public int IdMalla { get; init; }
    public List<int> IdsRequisitos { get; init; } = new();
}
