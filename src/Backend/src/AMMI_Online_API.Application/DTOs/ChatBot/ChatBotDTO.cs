namespace AMMI_Online_API.Application.DTOs.ChatBot;

public record ChatBotCicloDTO
{
    public string TipoOferta { get; set; } = string.Empty;
    public string PeriodoLectivo { get; set; } = string.Empty;
    public string DetalleCiclo { get; set; } = string.Empty;
    public bool EsActivo { get; set; }
    public IEnumerable<ChatBotMallaDTO> Mallas { get; set; } = new List<ChatBotMallaDTO>();
}

public record ChatBotMallaDTO
{
    public string MallaDetalle { get; set; } = string.Empty;
    public string CursoDetalle { get; set; } = string.Empty;
    public IEnumerable<ChatBotCostoMatriculaDTO> CostosMatricula { get; set; } = new List<ChatBotCostoMatriculaDTO>();
    public IEnumerable<ChatBotCostoPensionDTO> CostosPension { get; set; } = new List<ChatBotCostoPensionDTO>();
    public IEnumerable<ChatBotRequisitoDTO> Requisitos { get; set; } = new List<ChatBotRequisitoDTO>();
}

public record ChatBotRequisitoDTO
{
    public string Detalle { get; set; } = string.Empty;
    public bool EsObligatorio { get; set; }
}

public record ChatBotCostoMatriculaDTO
{
    public decimal CostoMatricula { get; set; }
    public bool EsDiferible { get; set; }
}

public record ChatBotCostoPensionDTO
{
    public decimal CostoPension { get; set; }
    public bool EsDiferible { get; set; }
}