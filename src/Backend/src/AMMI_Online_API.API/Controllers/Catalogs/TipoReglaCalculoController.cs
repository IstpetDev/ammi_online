using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TipoReglaCalculoController : ControllerBase
{
    private readonly IMediator _mediator;

    public TipoReglaCalculoController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    
    public async Task<ActionResult<IEnumerable<TipoReglaCalculoDTO>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetAllTipoReglaCalculosQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    
    public async Task<ActionResult<TipoReglaCalculoDTO>> Create([FromBody] TipoReglaCalculoCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateTipoReglaCalculoCommand(dto), cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = result.IdTipoReglaCalculo }, result);
    }

    [HttpPut]
    
    public async Task<ActionResult<TipoReglaCalculoDTO>> Update([FromBody] TipoReglaCalculoUpdateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateTipoReglaCalculoCommand(dto), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteTipoReglaCalculoCommand(id), cancellationToken);
        return Ok(result);
    }
}
