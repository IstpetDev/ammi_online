using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Segurity
{
    public class RolOperacionController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<RolOperacionDTO>>> GetAllRolOperacion([FromQuery] GetAllRolOperacionQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpGet("by-rol/{idRol}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<RolOperacionDTO>>> GetByRol(int idRol, CancellationToken cancellationToken)
            => await Mediator.Send(new GetRolOperacionByRolQuery(idRol), cancellationToken);

        [HttpGet("by-modulo-operacion/{idModuloOperacion}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<RolOperacionDTO>>> GetByModuloOperacion(int idModuloOperacion, CancellationToken cancellationToken)
            => await Mediator.Send(new GetRolOperacionByModuloOperacionQuery(idModuloOperacion), cancellationToken);

        [HttpGet("activos")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<RolOperacionDTO>>> GetActivos(CancellationToken cancellationToken)
            => await Mediator.Send(new GetRolOperacionActivosQuery(), cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateRolOperacion([FromBody] CreateRolOperacionCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateRolOperacion([FromBody] UpdateRolOperacionCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<Response<bool>> DeleteRolOperacion(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteRolOperacionCommand(id), cancellationToken);
    }
}
