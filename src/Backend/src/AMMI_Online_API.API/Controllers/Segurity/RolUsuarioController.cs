using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Segurity
{
    public class RolUsuarioController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<RolUsuarioDTO>>> GetAllRolUsuario([FromQuery] GetAllRolUsuarioQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpGet("by-rol/{idRol}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<RolUsuarioDTO>>> GetByRol(int idRol, CancellationToken cancellationToken)
            => await Mediator.Send(new GetRolUsuarioByRolQuery(idRol), cancellationToken);

        [HttpGet("by-persona/{idPersona}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<RolUsuarioDTO>>> GetByPersona(int idPersona, CancellationToken cancellationToken)
            => await Mediator.Send(new GetRolUsuarioByPersonaQuery(idPersona), cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateRolUsuario([FromBody] CreateRolUsuarioCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateRolUsuario([FromBody] UpdateRolUsuarioCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<Response<bool>> DeleteRolUsuario(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteRolUsuarioCommand(id), cancellationToken);
    }
}
