using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class TipoDatoContactoController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<TipoDatoContactoDTO>>> GetAllTipoDatoContacto([FromQuery] GetAllTipoDatoContactoQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        
        public async Task<Response<int>> CreateTipoDatoContacto([FromBody] CreateTipoDatoContactoCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        
        public async Task<Response<bool>> UpdateTipoDatoContacto([FromBody] UpdateTipoDatoContactoCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        
        public async Task<Response<bool>> DeleteTipoDatoContacto(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteTipoDatoContactoCommand(id), cancellationToken);
    }
}
