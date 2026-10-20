
namespace AMMI_Online_API.Application.DTOs.Notas
{
    public record NotaAlumnoParaleloDTO
    {
        public int IdMatricula { get; init; }
        public string NombreAlumno { get; init; } = string.Empty;
        public string NumeroDocumento { get; init; } = string.Empty;
        public decimal? ValorNota { get; init; }
        public string? Observacion { get; init; }
        public int? IdNotasAlumno { get; init; } // Useful for updates
    }

    public record ResumenNotasParaleloDTO
    {
        public int IdParalelo { get; init; }
        public string NombreParalelo { get; init; } = string.Empty;
        public int IdDetalleMalla { get; init; }
        public string NombreMateria { get; init; } = string.Empty;
        public string NombreDocente { get; init; } = string.Empty;

        public int TotalAlumnos { get; init; }
        public int AlumnosConNotas { get; init; }
        public int AlumnosAprobados { get; init; }
        public int AlumnosReprobados { get; init; }
        public int AlumnosPendientes { get; init; }
        public decimal PromedioGeneral { get; init; }
        public decimal NotaMaxima { get; init; }
        public decimal NotaMinima { get; init; }
    }
}
