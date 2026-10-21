using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class AreaCompetenciaController : ApiController
    {
        [HttpGet]
        public async Task<Response<IEnumerable<AreaCompetenciaDTO>>> GetAreaCompetencia(
            [FromQuery] GetAreaCompetenciaQuery query,
            CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreateAreaCompetencia(
            [FromBody] CreateAreaCompetenciaCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<bool>> UpdateAreaCompetencia(
            [FromBody] UpdateAreaCompetenciaCommand command,
            CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        public async Task<Response<bool>> DeleteAreaCompetencia(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteAreaCompetenciaCommand(id), cancellationToken);
    }
}
