using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace AMMI_Online_API.Application.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly string _smtpServer;
    private readonly int _smtpPort;
    private readonly string _senderEmail;
    private readonly string _senderName;
    private readonly string _username;
    private readonly string _password;
    private readonly bool _enableSsl;
    private readonly string? _adminEmail;

    public string? AdminEmail => _adminEmail;

    public EmailService(IConfiguration configuration)
    {
        var email = configuration.GetSection("EmailSettings");
        _smtpServer = (email["Host"] ?? email["SmtpServer"] ?? "smtp.office365.com").Trim();
        _smtpPort = int.Parse((email["Port"] ?? email["SmtpPort"] ?? "587").Trim());
        _senderEmail = (email["FromEmail"] ?? email["SenderEmail"] ?? "notificaciones@istpet.edu.ec").Trim();
        _senderName = (email["SenderName"] ?? "AMMI ONLINE").Trim();
        _username = (email["Username"] ?? _senderEmail).Trim();
        _password = (email["Password"] ?? "").Trim();
        _enableSsl = bool.Parse((email["EnableSsl"] ?? "true").Trim());
        
        var admin = email["AdminEmail"]?.Trim();
        _adminEmail = string.IsNullOrWhiteSpace(admin) ? null : admin;
    }

    public async Task<bool> SendEmailAsync(
        string destinatario,
        string asunto,
        string cuerpo,
        bool esHtml = true,
        CancellationToken cancellationToken = default)
    {
        return await SendEmailAsync(new[] { destinatario }, asunto, cuerpo, esHtml, cancellationToken);
    }

    public async Task<bool> SendEmailWithCcAsync(
        string destinatario,
        string asunto,
        string cuerpo,
        IEnumerable<string>? copias = null,
        bool esHtml = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = CreateSmtpClient();
            using var message = CreateMailMessage(asunto, cuerpo, esHtml);

            if (!string.IsNullOrWhiteSpace(destinatario))
            {
                try
                {
                    message.To.Add(new MailAddress(destinatario.Trim()));
                }
                catch (FormatException fEx)
                {
                    Console.WriteLine($"[EmailService] ⚠️ Formato de destinatario inválido: '{destinatario}' ({fEx.Message})");
                }
            }

            if (copias != null)
            {
                foreach (var cc in copias)
                {
                    if (string.IsNullOrWhiteSpace(cc)) continue;
                    var limpioCc = cc.Trim();
                    try
                    {
                        message.CC.Add(new MailAddress(limpioCc));
                    }
                    catch (FormatException fEx)
                    {
                        Console.WriteLine($"[EmailService] ⚠️ Formato de CC inválido: '{limpioCc}' ({fEx.Message})");
                    }
                }
            }

            if (message.To.Count == 0)
            {
                Console.WriteLine("[EmailService] ❌ No hay destinatarios válidos para enviar el email.");
                return false;
            }

            Console.WriteLine($"[EmailService] Enviando email a: {string.Join(", ", message.To.Select(t => t.Address))}{(message.CC.Count > 0 ? $" (CC: {string.Join(", ", message.CC.Select(c => c.Address))})" : "")}");
            await client.SendMailAsync(message, cancellationToken);
            Console.WriteLine($"[EmailService] ✅ Email enviado correctamente a: {string.Join(", ", message.To.Select(t => t.Address))}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] ❌ ERROR al enviar email con CC: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> SendEmailAsync(
        IEnumerable<string> destinatarios,
        string asunto,
        string cuerpo,
        bool esHtml = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = CreateSmtpClient();
            using var message = CreateMailMessage(asunto, cuerpo, esHtml);

            foreach (var rawDestinatario in destinatarios)
            {
                if (string.IsNullOrWhiteSpace(rawDestinatario))
                    continue;

                var limpio = rawDestinatario.Trim();
                try
                {
                    message.To.Add(new MailAddress(limpio));
                }
                catch (FormatException fEx)
                {
                    Console.WriteLine($"[EmailService] ⚠️ Formato de correo inválido descartado: '{limpio}' ({fEx.Message})");
                }
            }

            if (message.To.Count == 0)
            {
                Console.WriteLine("[EmailService] ❌ No hay destinatarios válidos para enviar el email.");
                return false;
            }

            Console.WriteLine($"[EmailService] Enviando email a: {string.Join(", ", message.To.Select(t => t.Address))}");
            Console.WriteLine($"[EmailService] SMTP: {_smtpServer}:{_smtpPort} | From: {_senderEmail} | SSL: {_enableSsl}");

            await client.SendMailAsync(message, cancellationToken);

            Console.WriteLine($"[EmailService] ✅ Email enviado correctamente a: {string.Join(", ", message.To.Select(t => t.Address))}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] ❌ ERROR al enviar email: {ex.GetType().Name}");
            Console.WriteLine($"[EmailService] Mensaje: {ex.Message}");
            if (ex.InnerException != null)
                Console.WriteLine($"[EmailService] InnerException: {ex.InnerException.Message}");
            return false;
        }
    }

    public async Task<bool> SendEmailWithAttachmentAsync(
        string destinatario,
        string asunto,
        string cuerpo,
        byte[] archivo,
        string nombreArchivo,
        bool esHtml = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(destinatario))
                return false;

            using var client = CreateSmtpClient();
            using var message = CreateMailMessage(asunto, cuerpo, esHtml);

            message.To.Add(new MailAddress(destinatario.Trim()));

            using var stream = new MemoryStream(archivo);
            var attachment = new Attachment(stream, nombreArchivo);
            message.Attachments.Add(attachment);

            await client.SendMailAsync(message, cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] ❌ ERROR al enviar email con adjunto: {ex.Message}");
            return false;
        }
    }

    private SmtpClient CreateSmtpClient()
    {
        return new SmtpClient(_smtpServer, _smtpPort)
        {
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_username, _password),
            EnableSsl = _enableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 20000
        };
    }

    private MailMessage CreateMailMessage(string asunto, string cuerpo, bool esHtml)
    {
        return new MailMessage
        {
            From = new MailAddress(_senderEmail, _senderName),
            Subject = asunto,
            Body = cuerpo,
            IsBodyHtml = esHtml
        };
    }
}
