using AMMI_Online_API.Application.DTOs.Catalogs;

namespace AMMI_Online_API.Application.DTOs.Infrastructure;

public record DetalleMallaDTO
{
    public int IdDetalleMalla { get; set; }
    public int IdMalla { get; set; }
    public int IdMateria { get; set; }
    public int IdPlantillaEvaluacion { get; set; }
    public int IdAreaCompetencia { get; set; }

    // Datos relacionados
    public string NombreMateria { get; set; } = string.Empty;
    public decimal HorasMateria { get; set; }
    public string NombrePlantilla { get; set; } = string.Empty;
    public string NombreAreaCompetencia { get; set; } = string.Empty;
    public IEnumerable<ParaleloDTO> Paralelo { get; set; } = new List<ParaleloDTO>();
}

public record DetalleMallaCreateDTO
{
    public int IdMalla { get; set; }
    public int IdMateria { get; set; }
    public int IdPlantillaEvaluacion { get; set; }
    public int IdAreaCompetencia { get; set; }
}

public record DetalleMallaUpdateDTO
{
    public int IdDetalleMalla { get; set; }
    public int IdPlantillaEvaluacion { get; set; }
    public int IdAreaCompetencia { get; set; }
}
