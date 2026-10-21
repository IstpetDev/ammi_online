using System;
using System.Collections.Generic;

namespace AMMI_Online_API.Application.DTOs.Distributive;

/// <summary>
/// DTO para asignacion masiva de un docente a multiples paralelos
/// </summary>
public record DistributivoMasivoDTO
{
    public int IdDetalleMalla { get; init; }
    public int? IdPersona { get; init; }
    public List<int> IdsMallaParalelos { get; init; } = new();
}

/// <summary>
/// DTO simplificado para seleccionar en dropdowns
/// </summary>
public record DistributivoSimpleDTO
{
    public int IdDistributivo { get; init; }
    public string NombreMateria { get; init; } = string.Empty;
    public string NombreParalelo { get; init; } = string.Empty;
    public string NombreDocente { get; init; } = string.Empty;
}

/// <summary>
/// DTO para mostrar asignaciones agrupadas por docente
/// </summary>
public record CargaDocenteDTO
{
    public int IdPersona { get; init; }
    public string NombreDocente { get; init; } = string.Empty;
    public string DocumentoDocente { get; init; } = string.Empty;
    public int TotalMaterias { get; init; }
    public int TotalParalelos { get; init; }
    public int TotalAlumnos { get; init; }
    public decimal TotalHoras { get; init; }
    public List<MallaCargaDTO> Mallas { get; init; } = new();
}

public record MallaCargaDTO
{
    public int IdMalla { get; init; }
    public string NombreMalla { get; init; } = string.Empty;
    public List<MateriaCargaDTO> Materias { get; init; } = new();
}

public record MateriaCargaDTO
{
    public int IdDetalleMalla { get; init; }
    public string NombreMateria { get; init; } = string.Empty;
    public decimal Horas { get; init; }
    public int? Modulo { get; init; }
    public DateOnly? FechaInicio { get; init; }
    public DateOnly? FechaFin { get; init; }
    public int? DiasGracia { get; init; }
    public string StatusPeriodo { get; init; } = string.Empty;
    public List<ParaleloCargaDTO> Paralelos { get; init; } = new();
}

public record ParaleloCargaDTO
{
    public int IdDistributivo { get; init; }
    public int IdMallaParalelo { get; init; }
    public int IdParalelo { get; init; }
    public string NombreParalelo { get; init; } = string.Empty;
    public int CantidadAlumnos { get; init; }
}

/// <summary>
/// DTO para listar docentes disponibles (con rol PROFESOR) — resumen superficial
/// </summary>
public record DocenteDisponibleDTO
{
    public int IdPersona { get; init; }
    public string NombreCompleto { get; init; } = string.Empty;
    public string Documento { get; init; } = string.Empty;
    public int AsignacionesActuales { get; init; }
    public decimal TotalHoras { get; init; }
    public int TotalParalelos { get; init; }
    public int TotalAlumnos { get; init; }
}

/// <summary>
/// DTO para un alumno dentro del detalle de un distributivo
/// </summary>
public record AlumnoDistributivoDTO
{
    public int IdMatricula { get; init; }
    public int IdUsuario { get; init; }
    public string NombreCompleto { get; init; } = string.Empty;
    public string Documento { get; init; } = string.Empty;
    public int IdEstadoMatricula { get; init; }
    public string DetalleEstado { get; init; } = string.Empty;
}
