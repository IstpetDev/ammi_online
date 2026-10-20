namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record PlantillaEstructuraDTO
{
    public int IdPlantillaEstructura { get; set; }
    public int IdPlantillaEvaluacion { get; set; }
    public int? IdNodoPadre { get; set; }
    public int? IdNodoHermano { get; set; }
    public string NodoNombre { get; set; } = string.Empty;
    public decimal Peso { get; set; }
    public int IdTipoPlantillaEstructura { get; set; } // Renamed in DB as IdTipoPlantillaEstrucutra? Check entity.
    public int Orden { get; set; }

    // Datos relacionados
    public string TipoNombre { get; set; } = string.Empty;

    // Nodos hijos (para estructura de arbol)
    public List<PlantillaEstructuraDTO> Hijos { get; set; } = new();
}

public record PlantillaEstructuraCreateDTO
{
    public int IdPlantillaEvaluacion { get; set; }
    public int? IdNodoPadre { get; set; }
    public string NodoNombre { get; set; } = string.Empty;
    public decimal Peso { get; set; }
    public int IdTipoPlantillaEstructura { get; set; }
    public int Orden { get; set; }
}

public record PlantillaEstructuraUpdateDTO
{
    public int IdPlantillaEstructura { get; set; }
    public string NodoNombre { get; set; } = string.Empty;
    public decimal Peso { get; set; }
    public int IdTipoPlantillaEstructura { get; set; }
    public int Orden { get; set; }
}

public record CrearEstructuraCompletaDTO
{
    public int IdPlantillaEvaluacion { get; set; }
    public List<NodoEstructuraDTO> Nodos { get; set; } = new();
}

public record NodoEstructuraDTO
{
    public string NodoNombre { get; set; } = string.Empty;
    public decimal Peso { get; set; }
    public int IdTipoPlantillaEstructura { get; set; }
    public int Orden { get; set; }
    public List<NodoEstructuraDTO> Hijos { get; set; } = new();
}

public record ValidacionPesosDTO
{
    public bool EsValido { get; set; }
    public decimal PesoTotal { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public List<NodoInvalidoDTO> NodosInvalidos { get; set; } = new();
}

public record NodoInvalidoDTO
{
    public int IdNodo { get; set; }
    public string NombreNodo { get; set; } = string.Empty;
    public decimal PesoHijos { get; set; }
    public string Problema { get; set; } = string.Empty;
}
