namespace AMMI_Online_API.Application.DTOs.Infrastructure;

public record DuplicarMallaRequest
{
    /// <summary>ID de la malla que se desea duplicar.</summary>
    public int IdMallaOrigen { get; init; }

    /// <summary>
    /// ID del ciclo destino. Debe estar activo (EsActivo = true) y no debe existir
    /// ya una malla con el mismo IdCursos + IdTipoOferta en ese ciclo.
    /// </summary>
    public int IdCicloDestino { get; init; }

    /// <summary>Exactamente 2 especies para el ciclo destino.</summary>
    public List<EspecieCicloInputDTO> Especies { get; init; } = new();
}

public record DuplicarMallaResultDTO
{
    public int IdMallaOrigen { get; init; }
    public int IdMallaDestino { get; init; }
    public int IdCicloDestino { get; init; }
    public int TotalDetalleMalla { get; init; }
    public int TotalRequisitos { get; init; }
    public List<int> IdsEspecieCiclo { get; init; } = new();
    public string Resumen { get; init; } = string.Empty;
}
