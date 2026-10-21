namespace AMMI_Online_API.Application.DTOs.Infrastructure;

public class ClonarMallasParaCicloRequest
{
    /// <summary>Ciclo del que se copian todas las mallas.</summary>
    public int IdCicloOrigen { get; set; }

    /// <summary>Ciclo activo que recibirá las nuevas mallas.</summary>
    public int IdCicloDestino { get; set; }

    /// <summary>Si true, también clona los MallaParalelo (con sus cupos originales).</summary>
    public bool ClonarParalelos { get; set; } = true;
}

public class ClonarMallaItemResultDTO
{
    public int IdMallaOrigen { get; set; }
    public int IdMallaDestino { get; set; }
    public string? Detalle { get; set; }
    public int TotalDetalles { get; set; }
    public int TotalRequisitos { get; set; }
    public int TotalEspecies { get; set; }
    public int TotalParalelos { get; set; }
}

public class ClonarMallasResultDTO
{
    public int IdCicloOrigen { get; set; }
    public int IdCicloDestino { get; set; }
    public int TotalMallasClonadas { get; set; }
    public List<ClonarMallaItemResultDTO> Mallas { get; set; } = new();
    public string Resumen { get; set; } = string.Empty;
}
