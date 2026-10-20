using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class ProvinciaController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<ProvinciaDTO>>> GetAllProvincia([FromQuery] GetAllProvinciaQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpGet("by-pais/{idPais}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<ProvinciaDTO>>> GetProvinciasByPais(int idPais, CancellationToken cancellationToken)
            => await Mediator.Send(new GetProvinciasByPaisQuery(idPais), cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateProvincia([FromBody] CreateProvinciaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateProvincia([FromBody] UpdateProvinciaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<Response<bool>> DeleteProvincia(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteProvinciaCommand(id), cancellationToken);
    }
}
