namespace AMMI_Online_API.Application.DTOs.Infrastructure;

public record MallaDTO
{
    public int IdMalla { get; set; }
    public string Detalle { get; set; }
    public int IdCursos { get; set; }
    public int IdCiclo { get; set; }

    // Datos relacionados
    public string NombreCurso { get; set; } = string.Empty;
    public string NombreTipoOferta { get; set; } = string.Empty;
    public string NombreEspecialidad { get; set; } = string.Empty;
    public string DetalleCiclo { get; set; } = string.Empty;
    public int? OrdenCurso { get; set; }
    public bool CicloEsActivo { get; set; }
    public bool TieneDetalleMalla { get; set; }
}

public record MallaCreateDTO
{
    public string Detalle { get; set; } = string.Empty;
    public int IdCursos { get; set; }
    public int IdCiclo { get; set; }
}

public record MallaUpdateDTO
{
    public int IdMalla { get; set; }
    public string Detalle { get; set; } = string.Empty;
    public int IdCursos { get; set; }
    public int IdCiclo { get; set; }
}

public record MallaCompletaDTO
{
    public int IdMalla { get; set; }
    public string Detalle { get; set; } = string.Empty;
    public string NombreCurso { get; set; } = string.Empty;
    public string NombreTipoOferta { get; set; } = string.Empty;

    // Un solo ciclo (antes era lista)
    public int IdCiclo { get; set; }
    public string DetalleCiclo { get; set; } = string.Empty;
    public bool CicloEsActivo { get; set; }

    // Materias de la malla
    public List<DetalleMallaDTO> Materias { get; set; } = new();

    // Totales
    public decimal TotalHoras { get; set; }
    public int TotalMaterias { get; set; }
}
