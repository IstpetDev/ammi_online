using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Segurity
{
    public class UsuarioController : ApiController
    {
        [HttpGet]
        
        public async Task<Response<IEnumerable<UsuarioDTO>>> GetAll ([FromQuery] UsuarioQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpGet("{id}")]
        
        public async Task<Response<UsuarioDTO>> GetBy(int id, CancellationToken cancellationToken)
            => new Response<UsuarioDTO>(await Mediator.Send(new GetUsuarioByIdQuery(id), cancellationToken));

        [HttpPost]
        
        public async Task<Response<int>> Create([FromBody] CreateUsuarioCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        
        public async Task<Response<bool>> Update ([FromBody] UpdateUsuarioCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        
        public async Task<Response<bool>> Delete(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteUsuarioCommand(id), cancellationToken);

    }
}
