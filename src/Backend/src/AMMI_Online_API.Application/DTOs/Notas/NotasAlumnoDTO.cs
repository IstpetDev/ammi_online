namespace AMMI_Online_API.Application.DTOs.Notas;

public record NotasAlumnoDTO
{
    public int IdNotasAlumno { get; init; }
    public int IdDetalleMatricula { get; init; } // Changed from IdMatricula
    public int IdPlantillaEstructura { get; init; }
    public decimal? ValorNota { get; init; }
    public string Observacion { get; init; } = string.Empty;

    // Datos relacionados
    public string NombreComponente { get; init; } = string.Empty;
    public decimal PesoComponente { get; init; }

    // Nuevos datos derivados
    public int? IdMatricula { get; init; }
    public string NombreMateria { get; init; } = string.Empty;
}

public record NotasAlumnoCreateDTO
{
    public int IdDetalleMatricula { get; init; } // Changed from IdMatricula
    public int IdPlantillaEstructura { get; init; }
    public decimal ValorNota { get; init; }
    public string? Observacion { get; init; }
}

public record NotasAlumnoUpdateDTO
{
    public int IdNotasAlumno { get; init; }
    public decimal ValorNota { get; init; }
    public string? Observacion { get; init; }
}

// DTO para boletin completo
public record BoletinAlumnoDTO
{
    public int IdMatricula { get; init; }
    public string NombreAlumno { get; init; } = string.Empty;
    public string Paralelo { get; init; } = string.Empty;
    public List<BoletinMateriaDTO> Materias { get; init; } = new();
}

public record BoletinMateriaDTO
{
    public int IdDetalleMalla { get; init; }
    public string NombreMateria { get; init; } = string.Empty;
    public int IdPlantillaEvaluacion { get; init; }
    public List<NotaArbolDTO> EstructuraNotas { get; init; } = new();
    public decimal? NotaFinal { get; init; }
    public string Estado { get; init; } = string.Empty; // Aprobado, Reprobado, Pendiente
}

public record NotaArbolDTO
{
    public int IdPlantillaEstructura { get; init; }
    public string NombreComponente { get; init; } = string.Empty;
    public decimal Peso { get; init; }
    public decimal? ValorNota { get; init; }
    public bool EsCalculada { get; init; }
    public string? Observacion { get; init; }
    public List<NotaArbolDTO> Hijos { get; init; } = new();
}

// DTO para ingreso masivo de notas
public record NotasMasivasDTO
{
    public int IdPlantillaEstructura { get; init; }
    public List<NotaAlumnoItemDTO> Notas { get; init; } = new();
}

public record NotaAlumnoItemDTO
{
    public int IdDetalleMatricula { get; init; } // Changed from IdMatricula
    public decimal ValorNota { get; init; }
    public string? Observacion { get; init; }
}
