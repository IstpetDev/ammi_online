using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class ParroquiaController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<ParroquiaDTO>>> GetAllParroquia([FromQuery] GetAllParroquiaQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpGet("by-canton/{idCanton}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<ParroquiaDTO>>> GetParroquiasByCanton(int idCanton, CancellationToken cancellationToken)
            => await Mediator.Send(new GetParroquiasByCantonQuery(idCanton), cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateParroquia([FromBody] CreateParroquiaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateParroquia([FromBody] UpdateParroquiaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<Response<bool>> DeleteParroquia(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteParroquiaCommand(id), cancellationToken);
    }
}
