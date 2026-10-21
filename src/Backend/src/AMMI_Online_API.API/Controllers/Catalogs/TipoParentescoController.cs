using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class TipoParentescoController : ApiController
    {

        [HttpGet]
        
        public async Task<Response<IEnumerable<TipoParentescoDTO>>> GetAllTipoParentesco([FromQuery] GetAllTipoParentescoQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreateTipoParentesco([FromBody] CreateTipoParentescoCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<bool>> UpdateTipoParentesco([FromBody] UpdateTipoParentescoCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        public async Task<Response<bool>> DeleteTipoParentesco(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteTipoParentescoCommand(id), cancellationToken);

    }
}
