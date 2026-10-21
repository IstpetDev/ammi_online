namespace AMMI_Online_API.Application.DTOs.Infrastructure;

// ── Datos de entrada ──────────────────────────────────────────────────────────

public record CrearMallaCompletaRequest
{
    /// <summary>
    /// Si es <c>true</c>, crea un nuevo Ciclo con los datos de <see cref="NuevoCiclo"/>.
    /// Si es <c>false</c>, usa el ciclo existente indicado en <see cref="IdCiclo"/>.
    /// </summary>
    public bool CrearCiclo { get; init; } = true;

    /// <summary>ID de un Ciclo ya existente. Requerido cuando <see cref="CrearCiclo"/> es <c>false</c>.</summary>
    public int? IdCiclo { get; init; }

    /// <summary>Datos para crear el Ciclo nuevo. Solo se usa cuando <see cref="CrearCiclo"/> es <c>true</c>.</summary>
    public CicloInputDTO NuevoCiclo { get; init; } = new();

    /// <summary>Datos para crear la Malla (se vincula al Ciclo resultante).</summary>
    public MallaInputDTO Malla { get; init; } = new();

    /// <summary>IDs de requisitos existentes que se asociarán a la malla.</summary>
    public List<int> IdsRequisitos { get; init; } = new();

    /// <summary>Lista de materias con su configuración de DetalleMalla.</summary>
    public List<DetalleMallaInputDTO> Materias { get; init; } = new();

    /// <summary>Exactamente 2 especies para el ciclo (matricula y otros cargos).</summary>
    public List<EspecieCicloInputDTO> Especies { get; init; } = new();

    /// <summary>Opcional: paralelo para crear MallaParalelo + Distributivos.</summary>
    public ParaleloMallaInputDTO? Paralelo { get; init; }
}

public record CicloInputDTO
{
    public int IdPeriodo { get; init; }
    public int IdRegimen { get; init; }
    public int? IdPadre { get; init; }
    public string Detalle { get; init; } = string.Empty;
    public DateOnly? FechaInicioEstimada { get; init; }
    public DateOnly? FechaFinEstimada { get; init; }
}

public record MallaInputDTO
{
    public string Detalle { get; init; } = string.Empty;
    public int IdCursos { get; init; }
    public int IdTipoOferta { get; init; }
}

public record DetalleMallaInputDTO
{
    public int IdMateria { get; init; }
    public int IdPlantillaEvaluacion { get; init; }
    public int IdAreaCompetencia { get; init; }
    public int? Modulo { get; init; }
    public DateOnly? FechaInicio { get; init; }
    public DateOnly? FechaFin { get; init; }
    public int? DuracionHoras { get; init; }
}

public record EspecieCicloInputDTO
{
    public int IdEspecie { get; init; }
    public decimal ValorEspecie { get; init; }
}

public record ParaleloMallaInputDTO
{
    public int IdParalelo { get; init; }
    public int? CupoMaximo { get; init; }
}

// ── Resultado ─────────────────────────────────────────────────────────────────

public record CrearMallaCompletaResultDTO
{
    public int IdCiclo { get; init; }
    public int IdMalla { get; init; }
    public List<int> IdsDetalleMalla { get; init; } = new();
    public List<int> IdsMallaRequisitos { get; init; } = new();
    public List<int> IdsEspecieCiclo { get; init; } = new();
    public int? IdMallaParalelo { get; init; }
    public List<int> IdsDistributivo { get; init; } = new();
    public string Resumen { get; init; } = string.Empty;
}

public record CursoConfigRequestDTO
{
    public int IdCiclo { get; init; }
    public int IdTipoOferta { get; init; }
    public int? IdEspecialidad { get; init; }
}

public record CursoConfigStatusDTO
{
    public int IdCurso { get; init; }
    public string Detalle { get; init; } = string.Empty;
    public int IdEspecialidad { get; init; }
    public int? IdMalla { get; init; }
    public bool TieneDetalleMalla { get; init; }
    public bool TieneRequisitos { get; init; }
    public bool TieneParalelos { get; init; }
    public bool TieneEspecies { get; init; }
    public string Estado { get; init; } = "sin_configurar"; // completo, parcial, sin_configurar
    public int MateriasCount { get; init; }
    public int RequisitosCount { get; init; }
    public int ParalelosCount { get; init; }
    public int EspeciesCount { get; init; }
}
