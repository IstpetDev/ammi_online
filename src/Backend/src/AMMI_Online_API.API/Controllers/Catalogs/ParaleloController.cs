using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class ParaleloController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<ParaleloDTO>>> GetParalelo(
            [FromQuery] GetParaleloQuery query,
            CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateParalelo(
            [FromBody] CreateParaleloCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateParalelo(
            [FromBody] UpdateParaleloCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<Response<bool>> DeleteParalelo(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteParaleloCommand(id), cancellationToken);
    }
}
