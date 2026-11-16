namespace AMMI_Online_API.Application.DTOs.Person;

public record FotoPerfilDTO
{
    public int IdDocumentosPersonales { get; set; }
    public int IdPersona { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string? PathFoto { get; set; }
    public int? IdAdjunto { get; set; }
    public bool? Estado { get; set; }
}
