namespace AMMI_Online_API.Application.DTOs.Infrastructure;

public record DetalleMallaDTO
{
    public int IdDetalleMalla { get; set; }
    public int IdMalla { get; set; }
    public int IdMateria { get; set; }
    public int IdPlantillaEvaluacion { get; set; }
    public int IdAreaCompetencia { get; set; }

    // Datos de programación
    public int? Modulo { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public int? DuracionHoras { get; set; }
    public int? DiasGracia { get; set; }

    public string NombreMateria { get; set; } = string.Empty;
    public decimal HorasMateria { get; set; }
    public string NombrePlantilla { get; set; } = string.Empty;
    public string NombreAreaCompetencia { get; set; } = string.Empty;
    public IEnumerable<MallaParaleloDTO> Paralelo { get; set; } = new List<MallaParaleloDTO>();
}

public record DetalleMallaCreateDTO
{
    public int IdMalla { get; set; }
    public int IdMateria { get; set; }
    public int IdPlantillaEvaluacion { get; set; }
    public int IdAreaCompetencia { get; set; }
    public int? Modulo { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public int? DuracionHoras { get; set; }
    public int? DiasGracia { get; set; }
}

public record DetalleMallaUpdateDTO
{
    public int IdDetalleMalla { get; set; }
    public int IdPlantillaEvaluacion { get; set; }
    public int IdAreaCompetencia { get; set; }
    public int? Modulo { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public int? DuracionHoras { get; set; }
    public int? DiasGracia { get; set; }
}

public record DetalleMallaModuloDTO
{
    public int? Modulo { get; init; }
    public DateOnly? FechaInicioModulo { get; init; }
    public DateOnly? FechaFinModulo { get; init; }
    public List<DetalleMallaDTO> Materias { get; init; } = new();
}

public record FechasSugeridasModuloDTO
{
    public bool TieneFechasSugeridas { get; init; }
    public int Modulo { get; init; }
    public DateOnly? FechaInicio { get; init; }
    public DateOnly? FechaFin { get; init; }
}

public record ActualizarFechasNotasMateriaDTO
{
    public int IdDetalleMalla { get; init; }
    public DateOnly? FechaInicio { get; init; }
    public DateOnly? FechaFin { get; init; }
    public int? DiasGracia { get; init; }
}

