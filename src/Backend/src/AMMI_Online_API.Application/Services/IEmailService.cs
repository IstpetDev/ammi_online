namespace AMMI_Online_API.Application.Services;

public interface IEmailService
{
    string? AdminEmail { get; }

    Task<bool> SendEmailAsync(
        string destinatario,
        string asunto,
        string cuerpo,
        bool esHtml = true,
        CancellationToken cancellationToken = default);

    Task<bool> SendEmailAsync(
        IEnumerable<string> destinatarios,
        string asunto,
        string cuerpo,
        bool esHtml = true,
        CancellationToken cancellationToken = default);

    Task<bool> SendEmailWithCcAsync(
        string destinatario,
        string asunto,
        string cuerpo,
        IEnumerable<string>? copias = null,
        bool esHtml = true,
        CancellationToken cancellationToken = default);

    Task<bool> SendEmailWithAttachmentAsync(
        string destinatario,
        string asunto,
        string cuerpo,
        byte[] archivo,
        string nombreArchivo,
        bool esHtml = true,
        CancellationToken cancellationToken = default);
}
