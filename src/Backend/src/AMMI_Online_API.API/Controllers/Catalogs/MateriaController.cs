using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs
{
    public class MateriaController : ApiController
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<Response<PaginatedResult<MateriaDTO>>> GetMaterias([FromQuery] GetMateriaQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreateMateria([FromBody] CreateMateriaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<bool>> UpdateMateria([FromBody] UpdateMateriaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete("{id}")]
        public async Task<Response<bool>> DeleteMateria(int id, CancellationToken cancellationToken)
            => await Mediator.Send(new DeleteMateriaCommand(id), cancellationToken);
    }
}
