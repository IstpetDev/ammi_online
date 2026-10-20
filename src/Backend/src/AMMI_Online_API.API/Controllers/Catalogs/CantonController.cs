using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class CantonController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<CantonDTO>>> GetAllCanton([FromQuery] GetAllCantonQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpGet("by-provincia/{idProvincia}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<CantonDTO>>> GetCantonesByProvincia(int idProvincia, CancellationToken cancellationToken)
            => await Mediator.Send(new GetCantonesByProvinciaQuery(idProvincia), cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateCanton([FromBody] CreateCantonCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateCanton([FromBody] UpdateCantonCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<Response<bool>> DeleteCanton(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteCantonCommand(id), cancellationToken);
    }
}
