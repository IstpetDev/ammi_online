using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person
{
    public class PersonaDiscapacidadController : ApiController
    {
        [HttpGet]
        public async Task<Response<IEnumerable<PersonaDiscapacidadDTO>>> GetByPersonaDiscapacidad([FromQuery] GetByPersonaDiscapacidadAsync query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreatePersonaDiscapacidad([FromForm] CreatePersonaDiscapacidadCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<IActionResult> UpdatePersonaDiscapacidad([FromForm] UpdatePersonaDiscapacidadCommand command, CancellationToken cancellationToken)
        {
            var autorizado = await AdjuntosAuthService.PuedeModificarDiscapacidadAsync(
                command.IdPersonaDiscapacidad, CurrentPersonaId, CurrentRoles, cancellationToken);
            if (!autorizado)
                return Forbid();

            var response = await Mediator.Send(command, cancellationToken);
            if (!response.IsSuccess)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpDelete]
        public async Task<IActionResult> DeletePersonaDiscapacidad([FromQuery] DeletePersonaDiscapacidadCommand command, CancellationToken cancellationToken)
        {
            var autorizado = await AdjuntosAuthService.PuedeEliminarDiscapacidadAsync(
                command.IdPersonaDiscapacidad, CurrentPersonaId, CurrentRoles, cancellationToken);
            if (!autorizado)
                return Forbid();

            var response = await Mediator.Send(command, cancellationToken);
            if (!response.IsSuccess)
                return NotFound(response);

            return Ok(response);
        }
    }
}
