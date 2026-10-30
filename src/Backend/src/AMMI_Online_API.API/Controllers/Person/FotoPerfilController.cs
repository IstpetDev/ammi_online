using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person;

public class FotoPerfilController : ApiController
{
    [HttpGet("{documento}")]
    public async Task<Response<FotoPerfilDTO>> GetByDocumento(string documento, CancellationToken cancellationToken)
        => await Mediator.Send(new GetFotoPerfilByDocumentoQuery(documento), cancellationToken);

    [HttpGet("{idPersona}")]
    public async Task<Response<FotoPerfilDTO>> GetByPersonaId(int idPersona, CancellationToken cancellationToken)
        => await Mediator.Send(new GetFotoPerfilByPersonaIdQuery(idPersona), cancellationToken);

    [HttpPut("{idDocumentosPersonales}")]
    public async Task<IActionResult> UpdateFoto(int idDocumentosPersonales, IFormFile archivo, CancellationToken cancellationToken)
    {
        var autorizado = await AdjuntosAuthService.PuedeModificarFotoPerfilAsync(idDocumentosPersonales, CurrentPersonaId, CurrentRoles, cancellationToken);
        if (!autorizado)
            return Forbid();

        var response = await Mediator.Send(new UpdateFotoPerfilCommand(idDocumentosPersonales, archivo), cancellationToken);
        if (!response.IsSuccess)
            return NotFound(response);

        return Ok(response);
    }

    [HttpDelete("{idDocumentosPersonales}")]
    public async Task<IActionResult> DeleteFoto(int idDocumentosPersonales, CancellationToken cancellationToken)
    {
        var autorizado = await AdjuntosAuthService.PuedeEliminarFotoPerfilAsync(idDocumentosPersonales, CurrentPersonaId, CurrentRoles, cancellationToken);
        if (!autorizado)
            return Forbid();

        var response = await Mediator.Send(new DeleteFotoPerfilCommand(idDocumentosPersonales), cancellationToken);
        if (!response.IsSuccess)
            return NotFound(response);

        return Ok(response);
    }

    [HttpDelete("{documento}")]
    [Authorize(Roles = "Administrador,SuperAdmin,Personal")]
    public async Task<Response<bool>> DeleteFotoAdminByDocumento(string documento, CancellationToken cancellationToken)
        => await Mediator.Send(new DeleteFotoPerfilAdminByDocumentoCommand(documento), cancellationToken);

    [HttpDelete("{idPersona}")]
    [Authorize(Roles = "Administrador,SuperAdmin,Personal")]
    public async Task<Response<bool>> DeleteFotoAdminByPersonaId(int idPersona, CancellationToken cancellationToken)
        => await Mediator.Send(new DeleteFotoPerfilAdminByPersonaIdCommand(idPersona), cancellationToken);
}
