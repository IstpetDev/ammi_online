namespace AMMI_Online_API.Application.DTOs.Distributive;

public record DistributivoDTO
{
    public int? IdDistributivo { get; init; }
    public int IdDetalleMalla { get; init; }
    public int? IdPersona { get; init; }   // null = sin docente asignado
    public int? IdParalelo { get; init; }  // null = sin paralelo asignado

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
    public int? CupoMaximo { get; init; }

    // Datos del Docente (null = sin docente asignado)
    public string NombreDocente { get; init; }
    public string DocumentoDocente { get; init; }

    // Conteo de alumnos
    public int CantidadAlumnos { get; init; }
}

public record DistributivoCreateDTO
{
    public int IdDetalleMalla { get; init; }
    public int IdPersona { get; init; }
    public int IdParalelo { get; init; }
}

public record DistributivoUpdateDTO
{
    public int IdDistributivo { get; init; }
    public int IdDetalleMalla { get; init; }
    public int IdPersona { get; init; }
    public int IdParalelo { get; init; }
}

public record AsignacionDocenteDTO
{
    public int IdDistributivo { get; init; }
    public int IdDetalleMalla { get; init; }
    public int IdParalelo { get; init; }
    public string NombreMateria { get; init; }
    public string NombreParalelo { get; init; }
    public int IdPlantillaEvaluacion { get; init; }
    public string NombrePlantilla { get; init; }
    public int CantidadAlumnos { get; init; }
}
