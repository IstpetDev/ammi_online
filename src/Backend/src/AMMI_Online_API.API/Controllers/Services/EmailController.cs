using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Services;
using AMMI_Online_API.Application.Features.Services.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Services;

public class EmailController : ApiController
{
    /// <summary>
    /// Envia un correo electronico a un destinatario
    /// </summary>
    [HttpPost("send")]
    [Authorize]
    public async Task<Response<EmailResponseDTO>> SendEmail(
        [FromBody] SendEmailCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    /// <summary>
    /// Envia un correo electronico a multiples destinatarios
    /// </summary>
    [HttpPost("send-multiple")]
    [Authorize]
    public async Task<Response<EmailResponseDTO>> SendEmailMultiple(
        [FromBody] SendEmailMultipleCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    /// <summary>
    /// Envia un correo electronico con archivo adjunto
    /// </summary>
    [HttpPost("send-with-attachment")]
    [Authorize]
    public async Task<Response<EmailResponseDTO>> SendEmailWithAttachment(
        [FromBody] SendEmailWithAttachmentCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);
}
