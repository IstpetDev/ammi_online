namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record ReglasCalculoDTO
{
    public int IdReglasCalculo { get; init; }
    public int IdTipoReglaCalculo { get; init; }
    public int IdPlantillaEstructura { get; init; }
    public decimal? NotaMinimaAprobar { get; init; }
    public decimal? NotaMinimaRecuperar { get; init; }

    // Datos relacionados
    public string TipoReglaDetalle { get; init; } = string.Empty;
    public string NodoNombre { get; init; } = string.Empty;
}

public record ReglasCalculoCreateDTO
{
    public int IdTipoReglaCalculo { get; init; }
    public int IdPlantillaEstructura { get; init; }
    public decimal? NotaMinimaAprobar { get; init; }
    public decimal? NotaMinimaRecuperar { get; init; }
}

public record ReglasCalculoUpdateDTO
{
    public int IdReglasCalculo { get; init; }
    public int IdTipoReglaCalculo { get; init; }
    public decimal? NotaMinimaAprobar { get; init; }
    public decimal? NotaMinimaRecuperar { get; init; }
}
