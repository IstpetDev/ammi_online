namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record PlantillaEvaluacionDTO
{
    public int IdPlantillaEvaluacion { get; set; }
    public string Nombre { get; set; }
    public string Detalle { get; set; }
    public bool EsActivo { get; set; }

    // NUEVO: Conteo de uso
    public int CantidadMateriasUsando { get; set; }
}

public record PlantillaEvaluacionCreateDTO
{
    public string Nombre { get; set; }
    public string Detalle { get; set; }
    public bool EsActivo { get; set; }
}

public record PlantillaEvaluacionUpdateDTO
{
    public int IdPlantillaEvaluacion { get; set; }
    public string Nombre { get; set; }
    public string Detalle { get; set; }
    public bool EsActivo { get; set; }
}

// NUEVO: DTO completo con estructura
public record PlantillaEvaluacionCompletaDTO
{
    public int IdPlantillaEvaluacion { get; set; }
    public string Nombre { get; set; }
    public string Detalle { get; set; }
    public bool EsActivo { get; set; }

    // Estructura de evaluacion (arbol)
    public List<PlantillaEstructuraDTO> Estructura { get; set; } = new();

    // Validacion
    public bool EstructuraValida { get; set; }
    public string MensajeValidacion { get; set; }
}
