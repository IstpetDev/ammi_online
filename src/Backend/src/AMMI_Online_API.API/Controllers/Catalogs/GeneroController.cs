using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.DTOs;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class GeneroController : ApiController
    {

        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<GeneroDTO>>> GetAllGenero([FromQuery] GetAllGenerosQuery query, CancellationToken cancellationToken)
            =>  await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<GeneroCreateDTO>> CreateGenero([FromBody] CreateGeneroCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<GeneroUpdateDTO>> UpdateGenero([FromBody] UpdateGeneroCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        public async Task<Response<bool>> DeleteGenero(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteGeneroCommand(id), cancellationToken);

    }
}