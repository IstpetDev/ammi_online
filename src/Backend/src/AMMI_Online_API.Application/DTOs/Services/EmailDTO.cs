namespace AMMI_Online_API.Application.DTOs.Services;

public class SendEmailDTO
{
    public string Destinatario { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string Cuerpo { get; set; } = string.Empty;
    public bool EsHtml { get; set; } = true;
}

public class SendEmailMultipleDTO
{
    public List<string> Destinatarios { get; set; } = new();
    public string Asunto { get; set; } = string.Empty;
    public string Cuerpo { get; set; } = string.Empty;
    public bool EsHtml { get; set; } = true;
}

public class SendEmailWithAttachmentDTO
{
    public string Destinatario { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string Cuerpo { get; set; } = string.Empty;
    public string ArchivoBase64 { get; set; } = string.Empty;
    public string NombreArchivo { get; set; } = string.Empty;
    public bool EsHtml { get; set; } = true;
}

public class EmailResponseDTO
{
    public bool Enviado { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}
