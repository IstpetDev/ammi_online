namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record RequisitosDTO
{
    public int IdRequisitos { get; set; }
    public int IdMalla { get; set; }
    public string Detalle { get; set; }
    public bool EsObligatorio { get; set; }
    public bool BloqueaInscripcion { get; set; }
    public string TipoDato { get; set; }
    public bool EsMayorEdad { get; set; }
    public bool EsFoto { get; set; }
}

public record RequisitosCreateDTO
{
    public int IdMalla { get; set; }
    public string Detalle { get; set; }
    public bool EsObligatorio { get; set; }
    public bool BloqueaInscripcion { get; set; }
    public string TipoDato { get; set; }
    public bool EsMayorEdad { get; set; }
    public bool EsFoto { get; set; }
}

public record RequisitosUpdateDTO
{
    public int IdRequisitos { get; set; }
    public int IdMalla { get; set; }
    public string Detalle { get; set; }
    public bool EsObligatorio { get; set; }
    public bool BloqueaInscripcion { get; set; }
    public string TipoDato { get; set; }
    public bool EsMayorEdad { get; set; }
    public bool EsFoto { get; set; }
}
