using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Segurity
{
    public class ModuloController : ApiController
    {
        [HttpGet]
        
        public async Task<Response<IEnumerable<ModuloDTO>>> GetAllModulo([FromQuery] GetAllModuloQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        
        public async Task<Response<int>> CreateModulo([FromBody] CreateModuloCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        
        public async Task<Response<bool>> UpdateModulo([FromBody] UpdateModuloCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        
        public async Task<Response<bool>> DeleteModulo(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteModuloCommand(id), cancellationToken);
    }
}
