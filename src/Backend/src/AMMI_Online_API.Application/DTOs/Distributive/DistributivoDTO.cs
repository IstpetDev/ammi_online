namespace AMMI_Online_API.Application.DTOs.Distributive;

public record DistributivoDTO
{
    public int? IdDistributivo { get; init; }
    public int IdDetalleMalla { get; init; }
    public int? IdPersona { get; init; }   // null = sin docente asignado
    public int? IdMallaParalelo { get; init; } // NULL para slots temporales si fuera necesario, pero la DB dice NOT NULL
    public int? IdParalelo { get; init; }      // De MallaParalelo -> IdParalelo

    // Datos del DetalleMalla
    public int IdMalla { get; init; }
    public int IdMateria { get; init; }

    // Datos de la Materia
    public string NombreMateria { get; init; }
    public decimal HorasMateria { get; init; }

    // Datos de la Malla
    public string NombreMalla { get; init; }
    public string TipoOferta { get; init; }

    // Datos del Ciclo (via Malla)
    public int IdCiclo { get; init; }
    public string NombreCiclo { get; init; }

    // Datos del Paralelo
    public string NombreParalelo { get; init; }
    public int? CupoMaximo { get; init; } // de MallaParalelo.CupoMaximo

    // Datos del Docente (null = sin docente asignado)
    public string NombreDocente { get; init; }
    public string DocumentoDocente { get; init; }

    // Conteo de alumnos
    public int CantidadAlumnos { get; init; }

    // Nuevos campos PLAN_DISTRIBUTIVO
    public bool? EsActivo { get; init; }
    public bool TieneDocente => IdPersona.HasValue;

    // Fechas de ingreso de notas
    public DateOnly? FechaInicio { get; init; }
    public DateOnly? FechaFin { get; init; }
    public int? DiasGracia { get; init; }
    public string StatusPeriodo { get; init; } = string.Empty;
}

public record DistributivoCreateDTO
{
    public int IdDetalleMalla { get; init; }
    public int? IdPersona { get; init; } // Permite slot sin docente (null)
    public int IdMallaParalelo { get; init; }
}

public record DistributivoUpdateDTO
{
    public int IdDistributivo { get; init; }
    public int IdDetalleMalla { get; init; }
    public int? IdPersona { get; init; } // Permite slot sin docente (null)
    public int IdMallaParalelo { get; init; }
    public bool? Activo { get; init; }
}

public record AsignacionDocenteDTO
{
    public int IdDistributivo { get; init; }
    public int IdDetalleMalla { get; init; }
    public int IdMallaParalelo { get; init; }
    public string NombreMateria { get; init; }
    public string NombreParalelo { get; init; }
    public int IdPlantillaEvaluacion { get; init; }
    public string NombrePlantilla { get; init; }
    public int CantidadAlumnos { get; init; }
}

public record DistributivoConAlumnosDTO : DistributivoDTO
{
    public List<AlumnoDistributivoDTO> Alumnos { get; init; } = new();
}

public record DistributivoItemDTO
{
    public int IdDistributivo { get; init; }
    public int IdDetalleMalla { get; init; }
    public int IdMateria { get; init; }
    public string NombreMateria { get; init; } = string.Empty;
    public decimal HorasMateria { get; init; }
    public int? IdPersona { get; init; }
    public string NombreDocente { get; init; } = string.Empty;
    public string DocumentoDocente { get; init; } = string.Empty;
    public bool TieneDocente => IdPersona.HasValue;
    public bool? EsActivo { get; init; }
    public DateOnly? FechaInicio { get; init; }
    public DateOnly? FechaFin { get; init; }
    public int? DiasGracia { get; init; }
    public string StatusPeriodo { get; init; } = string.Empty;
}

public record ParaleloConDistributivosDTO
{
    public int IdMallaParalelo { get; init; }
    public int IdParalelo { get; init; }
    public string NombreParalelo { get; init; } = string.Empty;
    public int? CupoMaximo { get; init; }
    public bool EsActivo { get; init; }
    public int CantidadAlumnos { get; init; }

    public int IdMalla { get; init; }
    public string NombreMalla { get; init; } = string.Empty;
    public string TipoOferta { get; init; } = string.Empty;
    public int IdCiclo { get; init; }
    public string NombreCiclo { get; init; } = string.Empty;

    public List<DistributivoItemDTO> Distributivos { get; init; } = new();
}
