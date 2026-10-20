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

    public EmailService(IConfiguration configuration)
    {
        var email = configuration.GetSection("EmailSettings");
        _smtpServer = email["Host"] ?? email["SmtpServer"]!;
        _smtpPort = int.Parse(email["Port"] ?? email["SmtpPort"] ?? "587");
        _senderEmail = email["FromEmail"] ?? email["SenderEmail"]!;
        _senderName = email["SenderName"]!;
        _username = email["Username"] ?? _senderEmail;
        _password = email["Password"]!;
        _enableSsl = bool.Parse(email["EnableSsl"] ?? "true");
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

            foreach (var destinatario in destinatarios)
            {
                message.To.Add(destinatario);
            }

            await client.SendMailAsync(message, cancellationToken);
            return true;
        }
        catch (Exception)
        {
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
            using var client = CreateSmtpClient();
            using var message = CreateMailMessage(asunto, cuerpo, esHtml);

            message.To.Add(destinatario);

            using var stream = new MemoryStream(archivo);
            var attachment = new Attachment(stream, nombreArchivo);
            message.Attachments.Add(attachment);

            await client.SendMailAsync(message, cancellationToken);
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    private SmtpClient CreateSmtpClient()
    {
        return new SmtpClient(_smtpServer, _smtpPort)
        {
            Credentials = new NetworkCredential(_username, _password),
            EnableSsl = _enableSsl
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
