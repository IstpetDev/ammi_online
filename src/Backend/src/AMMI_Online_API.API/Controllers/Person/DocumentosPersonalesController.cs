using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person
{
    public class DocumentosPersonalesController : ApiController
    {
        [HttpGet]
        public async Task<Response<IEnumerable<DocumentosPersonalesDTO>>> GetByDocumentosPersonales([FromQuery] GetByDocumentosPersonalesQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreateDocumentosPersonales([FromForm] CreateDocumentosPersonalesCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<IActionResult> UpdateDocumentosPersonales([FromForm] UpdateDocumentosPersonalesCommand command, CancellationToken cancellationToken)
        {
            var autorizado = await AdjuntosAuthService.PuedeModificarDocumentoPersonalAsync(
                command.IdDocumentosPersonales, CurrentPersonaId, CurrentRoles, cancellationToken);
            if (!autorizado)
                return Forbid();

            var response = await Mediator.Send(command, cancellationToken);
            if (!response.IsSuccess)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteDocumentosPersonales([FromQuery] DeleteDocumentosPersonalesCommand command, CancellationToken cancellationToken)
        {
            var autorizado = await AdjuntosAuthService.PuedeEliminarDocumentoPersonalAsync(
                command.IdDocumentosPersonales, CurrentPersonaId, CurrentRoles, cancellationToken);
            if (!autorizado)
                return Forbid();

            var response = await Mediator.Send(command, cancellationToken);
            if (!response.IsSuccess)
                return NotFound(response);

            return Ok(response);
        }
    }
}
