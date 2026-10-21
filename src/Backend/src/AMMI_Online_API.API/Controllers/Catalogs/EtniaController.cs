using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class EtniaController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<EtniaDTO>>> GetAllEtnias([FromQuery] GetAllEtniasQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreateEtnia([FromBody] CreateEtniaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<bool>> UpdateEtnia([FromBody] UpdateEtniaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        public async Task<Response<bool>> DeleteEtnia(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteEtniaCommand(id), cancellationToken);
    }
}
