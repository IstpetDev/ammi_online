using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Services;
using AMMI_Online_API.Application.Features.Services.Commands;
using AMMI_Online_API.Application.Services;
using MediatR;

namespace AMMI_Online_API.Application.Features.Services.Handlers;

public class SendEmailCommandHandler : IRequestHandler<SendEmailCommand, Response<EmailResponseDTO>>
{
    private readonly IEmailService _emailService;

    public SendEmailCommandHandler(IEmailService emailService)
    {
        _emailService = emailService;
    }

    public async Task<Response<EmailResponseDTO>> Handle(SendEmailCommand request, CancellationToken cancellationToken)
    {
        var enviado = await _emailService.SendEmailAsync(
            request.Destinatario,
            request.Asunto,
            request.Cuerpo,
            request.EsHtml,
            cancellationToken);

        var response = new EmailResponseDTO
        {
            Enviado = enviado,
            Mensaje = enviado ? "Correo enviado correctamente" : "Error al enviar el correo"
        };

        return enviado
            ? Response<EmailResponseDTO>.Success(response, "Correo enviado correctamente")
            : Response<EmailResponseDTO>.Failure("Error al enviar el correo");
    }
}

public class SendEmailMultipleCommandHandler : IRequestHandler<SendEmailMultipleCommand, Response<EmailResponseDTO>>
{
    private readonly IEmailService _emailService;

    public SendEmailMultipleCommandHandler(IEmailService emailService)
    {
        _emailService = emailService;
    }

    public async Task<Response<EmailResponseDTO>> Handle(SendEmailMultipleCommand request, CancellationToken cancellationToken)
    {
        var enviado = await _emailService.SendEmailAsync(
            request.Destinatarios,
            request.Asunto,
            request.Cuerpo,
            request.EsHtml,
            cancellationToken);

        var response = new EmailResponseDTO
        {
            Enviado = enviado,
            Mensaje = enviado ? "Correos enviados correctamente" : "Error al enviar los correos"
        };

        return enviado
            ? Response<EmailResponseDTO>.Success(response, "Correos enviados correctamente")
            : Response<EmailResponseDTO>.Failure("Error al enviar los correos");
    }
}

public class SendEmailWithAttachmentCommandHandler : IRequestHandler<SendEmailWithAttachmentCommand, Response<EmailResponseDTO>>
{
    private readonly IEmailService _emailService;

    public SendEmailWithAttachmentCommandHandler(IEmailService emailService)
    {
        _emailService = emailService;
    }

    public async Task<Response<EmailResponseDTO>> Handle(SendEmailWithAttachmentCommand request, CancellationToken cancellationToken)
    {
        var archivo = Convert.FromBase64String(request.ArchivoBase64);

        var enviado = await _emailService.SendEmailWithAttachmentAsync(
            request.Destinatario,
            request.Asunto,
            request.Cuerpo,
            archivo,
            request.NombreArchivo,
            request.EsHtml,
            cancellationToken);

        var response = new EmailResponseDTO
        {
            Enviado = enviado,
            Mensaje = enviado ? "Correo con adjunto enviado correctamente" : "Error al enviar el correo"
        };

        return enviado
            ? Response<EmailResponseDTO>.Success(response, "Correo con adjunto enviado correctamente")
            : Response<EmailResponseDTO>.Failure("Error al enviar el correo");
    }
}
