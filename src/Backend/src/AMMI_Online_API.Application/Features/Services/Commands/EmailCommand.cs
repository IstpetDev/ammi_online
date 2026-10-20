using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Services;
using MediatR;

namespace AMMI_Online_API.Application.Features.Services.Commands;

public record SendEmailCommand(
    string Destinatario,
    string Asunto,
    string Cuerpo,
    bool EsHtml = true
) : IRequest<Response<EmailResponseDTO>>;

public record SendEmailMultipleCommand(
    List<string> Destinatarios,
    string Asunto,
    string Cuerpo,
    bool EsHtml = true
) : IRequest<Response<EmailResponseDTO>>;

public record SendEmailWithAttachmentCommand(
    string Destinatario,
    string Asunto,
    string Cuerpo,
    string ArchivoBase64,
    string NombreArchivo,
    bool EsHtml = true
) : IRequest<Response<EmailResponseDTO>>;
