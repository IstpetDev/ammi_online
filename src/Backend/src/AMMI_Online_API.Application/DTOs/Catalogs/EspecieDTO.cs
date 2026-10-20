namespace AMMI_Online_API.Application.DTOs.Catalogs;

public record EspecieDTO
{
    public int IdEspecie { get; set; }
    public string Detalle { get; set; }
    public bool EsDiferible { get; set; }
    public int? MaximoDiferidos { get; set; }
    public bool? Activo { get; set; }
}

public record EspecieCreateDTO
{
    public string Detalle { get; set; }
    public bool EsDiferible { get; set; }
    public int? MaximoDiferidos { get; set; }
    public bool? Activo { get; set; }
}

public record EspecieUpdateDTO
{
    public int IdEspecie { get; set; }
    public string Detalle { get; set; }
    public bool EsDiferible { get; set; }
    public int? MaximoDiferidos { get; set; }
    public bool? Activo { get; set; }
}
