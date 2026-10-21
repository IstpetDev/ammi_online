namespace AMMI_Online_API.Application.DTOs.Postulations;

public enum MotivoReMatricula
{
    REPETIR,
    AVANZAR,
    SIN_CALIFICACIONES,
    YA_MATRICULADO,
    SIN_MATRICULA_PREVIA,
    MALLA_DESTINO_NO_ENCONTRADA,
    SIN_PARALELOS_DISPONIBLES,
    DEUDA_PENDIENTE
}

public class ReMatriculaInfoDTO
{
    public int IdPersona { get; set; }
    public int? IdMatriculaActual { get; set; }
    public bool PuedeReMatricular { get; set; }
    public MotivoReMatricula Motivo { get; set; }
    public string MensajeDiagnostico { get; set; } = string.Empty;

    public int? IdMallaOrigen { get; set; }
    public string? DetalleMallaOrigen { get; set; }
    public int? IdCursosOrigen { get; set; }
    public int? OrdenCursosOrigen { get; set; }

    public int? IdMallaDestino { get; set; }
    public string? DetalleMallaDestino { get; set; }

    public List<ParaleloDisponibleDTO> ParalelosDisponibles { get; set; } = new();
}

public class ParaleloDisponibleDTO
{
    public int IdMallaParalelo { get; set; }
    public string? DetalleParalelo { get; set; }
    public int CupoMaximo { get; set; }
    public int Matriculados { get; set; }
    public int CupoDisponible { get; set; }
}

public class ReMatricularResultDTO
{
    public int IdPersona { get; set; }
    public int IdMatriculaNueva { get; set; }
    public int IdMallaParalelo { get; set; }
    public bool MatriculaAnteriorCerrada { get; set; }
    public string Resumen { get; set; } = string.Empty;
}
