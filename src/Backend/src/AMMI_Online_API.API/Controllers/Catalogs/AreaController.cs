using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class AreaController : ApiController
    {
        [HttpGet]
        public async Task<Response<IEnumerable<AreaDTO>>> GetArea(
            [FromQuery] GetAreaQuery query,
            CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreateArea(
            [FromBody] CreateAreaCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<bool>> UpdateArea(
            [FromBody] UpdateAreaCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        public async Task<Response<bool>> DeleteArea(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteAreaCommand(id), cancellationToken);
    }
}
