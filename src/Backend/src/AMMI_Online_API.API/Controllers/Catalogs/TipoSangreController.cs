using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs;

[Authorize]
public class TipoSangreController : ApiController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<Response<IEnumerable<TipoSangreDTO>>> GetAll(CancellationToken cancellationToken)
        => new Response<IEnumerable<TipoSangreDTO>>(await Mediator.Send(new GetAllTipoSangreQuery(), cancellationToken));

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<Response<TipoSangreDTO>> GetById(int id, CancellationToken cancellationToken)
        => new Response<TipoSangreDTO>(await Mediator.Send(new GetTipoSangreByIdQuery(id), cancellationToken));

    [HttpPost]
    [AllowAnonymous]
    public async Task<Response<TipoSangreDTO>> Create([FromBody] TipoSangreDTO tipoSangre, CancellationToken cancellationToken)
        => new Response<TipoSangreDTO>(await Mediator.Send(new CreateTipoSangreCommand(tipoSangre), cancellationToken));

    [HttpPut]
    [AllowAnonymous]
    public async Task<Response<TipoSangreDTO>> Update([FromBody] TipoSangreDTO tipoSangre, CancellationToken cancellationToken)
        => new Response<TipoSangreDTO>(await Mediator.Send(new UpdateTipoSangreCommand(tipoSangre), cancellationToken));

    [HttpDelete("{id}")]
    [AllowAnonymous]
    public async Task<Response<bool>> Delete(int id, CancellationToken cancellationToken)
        => new Response<bool>(await Mediator.Send(new DeleteTipoSangreCommand(id), cancellationToken));
}
