using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Infrastructure;

[ApiController]
[Route("api/[controller]")]
public class MallaController : ApiController
{
    private readonly IMediator _mediator;

    public MallaController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<Response<PaginatedResult<MallaDTO>>> GetAll([FromQuery] GetAllMallasQuery query, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Response<PaginatedResult<MallaDTO>>.Success(result, "Consulta exitosa");
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<MallaDTO>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetMallaByIdQuery(id), cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("ByCiclo/{idCiclo}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<MallaDTO>>> GetByCiclo(int idCiclo, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetMallasByCicloIdQuery(idCiclo), cancellationToken);
        return Ok(result);
    }

    [HttpGet("GetMallaByTipoOferta/{idTipoOferta}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<MallaDTO>>> GetMallaByTipoOferta(int idTipoOferta, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetMallaByTipoOfertaWithActiveCicloQuery(idTipoOferta), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<MallaDTO>> Create([FromBody] MallaCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateMallaCommand(dto), cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = result.IdMalla }, result);
    }

    [HttpPut]
    [AllowAnonymous]
    public async Task<ActionResult<MallaDTO>> Update([FromBody] MallaUpdateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateMallaCommand(dto), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteMallaCommand(id), cancellationToken);
        return Ok(result);
    }
}
