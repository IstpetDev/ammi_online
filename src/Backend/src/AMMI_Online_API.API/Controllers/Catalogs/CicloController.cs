using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class CicloController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<CicloDTO>>> GetCiclo(
            [FromQuery] GetCicloQuery query,
            CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreateCiclo(
            [FromBody] CreateCicloCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<bool>> UpdateCiclo(
            [FromBody] UpdateCicloCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}/desactivar")]
        public async Task<Response<bool>> DeactivateCiclo(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DesactivateCicloCommand(id), cancellationToken);

        [HttpDelete("{id}")]
        public async Task<Response<bool>> DeleteCiclo(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteCicloCommand(id), cancellationToken);
    }
}
