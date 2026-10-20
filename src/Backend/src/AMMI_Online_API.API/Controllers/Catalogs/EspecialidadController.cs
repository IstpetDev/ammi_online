using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class EspecialidadController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<EspecialidadDTO>>> GetEspecialidad(
            [FromQuery] GetEspecialidadQuery query,
            CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateEspecialidad(
            [FromBody] CreateEspecialidadCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateEspecialidad(
            [FromBody] UpdateEspecialidadCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<Response<bool>> DeleteEspecialidad(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteEspecialidadCommand(id), cancellationToken);
    }
}
