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
    [AllowAnonymous]
    public async Task<Response<FotoPerfilDTO>> UpdateFoto(int idDocumentosPersonales, IFormFile archivo, CancellationToken cancellationToken)
        => await Mediator.Send(new UpdateFotoPerfilCommand(idDocumentosPersonales, archivo), cancellationToken);

    [HttpDelete("{idDocumentosPersonales}")]
    public async Task<Response<bool>> DeleteFoto(int idDocumentosPersonales, CancellationToken cancellationToken)
        => await Mediator.Send(new DeleteFotoPerfilCommand(idDocumentosPersonales), cancellationToken);

    [HttpDelete("{documento}")]
    public async Task<Response<bool>> DeleteFotoAdminByDocumento(string documento, CancellationToken cancellationToken)
        => await Mediator.Send(new DeleteFotoPerfilAdminByDocumentoCommand(documento), cancellationToken);

    [HttpDelete("{idPersona}")]
    public async Task<Response<bool>> DeleteFotoAdminByPersonaId(int idPersona, CancellationToken cancellationToken)
        => await Mediator.Send(new DeleteFotoPerfilAdminByPersonaIdCommand(idPersona), cancellationToken);
}
