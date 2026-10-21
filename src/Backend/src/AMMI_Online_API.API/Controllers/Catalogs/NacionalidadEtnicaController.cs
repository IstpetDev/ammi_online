using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class NacionalidadEtnicaController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<NacionalidadEtnicaDTO>>> GetAllNacionalidadEtnica([FromQuery] GetAllNacionalidadEtnicaQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpGet("by-etnia/{idEtnia}")]
        public async Task<Response<IEnumerable<NacionalidadEtnicaDTO>>> GetNacionalidadEtnicaByEtnia(int idEtnia, CancellationToken cancellationToken)
            => await Mediator.Send(new GetNacionalidadEtnicaByEtniaQuery(idEtnia), cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreateNacionalidadEtnica([FromBody] CreateNacionalidadEtnicaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<bool>> UpdateNacionalidadEtnica([FromBody] UpdateNacionalidadEtnicaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        public async Task<Response<bool>> DeleteNacionalidadEtnica(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteNacionalidadEtnicaCommand(id), cancellationToken);
    }
}
