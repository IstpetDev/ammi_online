using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Segurity
{
    public class ModuloOperacionController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<ModuloOperacionDTO>>> GetAllModuloOperacion([FromQuery] GetAllModuloOperacionQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpGet("by-modulo/{idModulo}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<ModuloOperacionDTO>>> GetByModulo(int idModulo, CancellationToken cancellationToken)
            => await Mediator.Send(new GetModuloOperacionByModuloQuery(idModulo), cancellationToken);

        [HttpGet("by-operacion/{idOperacion}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<ModuloOperacionDTO>>> GetByOperacion(int idOperacion, CancellationToken cancellationToken)
            => await Mediator.Send(new GetModuloOperacionByOperacionQuery(idOperacion), cancellationToken);

        [HttpGet("activos")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<ModuloOperacionDTO>>> GetActivos(CancellationToken cancellationToken)
            => await Mediator.Send(new GetModuloOperacionActivosQuery(), cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateModuloOperacion([FromBody] CreateModuloOperacionCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateModuloOperacion([FromBody] UpdateModuloOperacionCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<Response<bool>> DeleteModuloOperacion(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteModuloOperacionCommand(id), cancellationToken);
    }
}
