using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class TipoDocumentoPersonalController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<TipoDocumentoPersonalDTO>>> GetAllTipoDocumentoPersonal([FromQuery] GetAllTipoDocumentoPersonalQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateTipoDocumentoPersonal([FromBody] CreateTipoDocumentoPersonalCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateTipoDocumentoPersonal([FromBody] UpdateTipoDocumentoPersonalCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<Response<bool>> DeleteTipoDocumentoPersonal(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteTipoDocumentoPersonalCommand(id), cancellationToken);
    }
}
