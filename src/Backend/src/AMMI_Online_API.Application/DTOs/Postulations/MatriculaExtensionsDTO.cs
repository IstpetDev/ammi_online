
namespace AMMI_Online_API.Application.DTOs.Postulations
{
    public record MatriculaConDetalleDTO
    {
        public int IdMatricula { get; init; }
        public int IdUsuarioAlumno { get; init; }
        public int IdMallaParalelo { get; init; }
        public int IdEstadoMatricula { get; init; }
        public string DetalleEstado { get; init; } = string.Empty;

        // Datos del paralelo
        public string NombreParalelo { get; init; } = string.Empty;

        // Datos de la malla (via paralelo o detalle matricula)
        public int IdMalla { get; init; }
        public string NombreMalla { get; init; } = string.Empty;

        // Datos del ciclo
        public int IdCiclo { get; init; }
        public string NombreCiclo { get; init; } = string.Empty;
        public DateOnly? FechaInicio { get; init; }
        public DateOnly? FechaFin { get; init; }

        // Materias inscritas
        public List<DetalleMateriaInscritaDTO> Materias { get; init; } = new();
    }

    public record DetalleMateriaInscritaDTO
    {
        public int IdDetalleMatricula { get; init; }
        public int IdDetalleMalla { get; init; }
        public string NombreMateria { get; init; } = string.Empty;
        public decimal? NotaFinal { get; init; }
        public decimal? ExamenRemedial { get; init; }
        public string Estado { get; init; } = string.Empty; // Aprobado, Reprobado, En curso
        public string? Docente { get; init; }
        public string? EmailDocente { get; init; }
        public DateOnly? FechaInicio { get; init; }
        public DateOnly? FechaFin { get; init; }
        public int? DuracionHoras { get; init; }
        public int? Modulo { get; init; }
        public string? AreaCompetencia { get; init; }
    }

    // Para historial completo del alumno
    public record HistorialAcademicoDTO
    {
        public int IdUsuario { get; init; }
        public string NombreAlumno { get; init; } = string.Empty;
        public string NumeroDocumento { get; init; } = string.Empty;
        public List<MallaHistorialDTO> Mallas { get; init; } = new();
    }

    public record MallaHistorialDTO
    {
        public int IdMalla { get; init; }
        public string NombreMalla { get; init; } = string.Empty;
        public string TipoOferta { get; init; } = string.Empty;
        public List<CicloHistorialDTO> Ciclos { get; init; } = new();
    }

    public record CicloHistorialDTO
    {
        public int IdCiclo { get; init; }
        public string NombreCiclo { get; init; } = string.Empty;
        public string? NombreParalelo { get; init; }
        public DateOnly? FechaInicio { get; init; }
        public DateOnly? FechaFin { get; init; }
        public int IdMatricula { get; init; }
        public List<MateriaHistorialDTO> Materias { get; set; } = new();
        public decimal? PromedioGeneral { get; set; }
    }

    public record MateriaHistorialDTO
    {
        public int IdDetalleMalla { get; init; }
        public int? IdDetalleMatricula { get; init; }
        public int? IdPlantillaEvaluacion { get; init; }
        public string NombreMateria { get; init; } = string.Empty;
        public decimal? NotaFinal { get; init; }
        public decimal? ExamenRemedial { get; init; }
        public string Estado { get; init; } = string.Empty;
        public string? Docente { get; init; }
        public string? EmailDocente { get; init; }
        public DateOnly? FechaInicio { get; init; }
        public DateOnly? FechaFin { get; init; }
        public int? DuracionHoras { get; init; }
        public int? Modulo { get; init; }
        public string? AreaCompetencia { get; init; }
        public int? DiasGracia { get; init; }
        public string StatusPeriodo { get; init; } = string.Empty;
        public bool PeriodoActivo { get; init; }
        public string MensajePeriodo { get; init; } = string.Empty;
    }

    public record RegistrarRemedialDTO
    {
        public decimal NotaRemedial { get; init; }
    }
}
