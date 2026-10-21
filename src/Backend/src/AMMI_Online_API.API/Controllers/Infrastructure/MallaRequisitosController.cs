using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Infrastructure;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MallaRequisitosController : ControllerBase
{
    private readonly IMediator _mediator;

    public MallaRequisitosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<MallaRequisitosDTO>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetAllMallaRequisitosQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    
    public async Task<ActionResult<MallaRequisitosDTO>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetMallaRequisitosByIdQuery(id), cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("ByMalla/{idMalla}")]
    
    public async Task<ActionResult<IEnumerable<MallaRequisitosDTO>>> GetByMalla(int idMalla, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetRequistosByMallaIdQuery(idMalla), cancellationToken);
        return Ok(result);
    }

    [HttpGet("ByRequisito/{idRequisito}")]
    
    public async Task<ActionResult<IEnumerable<MallaRequisitosDTO>>> GetByRequisito(int idRequisito, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetMallasByRequisitoIdQuery(idRequisito), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    
    public async Task<ActionResult<MallaRequisitosDTO>> Create([FromBody] MallaRequisitosCreateDTO dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new CreateMallaRequisitosCommand(dto), cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.IdMallaRequisitos }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("AsignarRequisitos")]
    
    public async Task<ActionResult<IEnumerable<MallaRequisitosDTO>>> AsignarRequisitos([FromBody] AsignarRequisitosAMallaDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new AsignarRequisitosAMallaCommand(dto), cancellationToken);
        return Ok(result);
    }

    [HttpPut("ReemplazarRequisitos")]
    
    public async Task<ActionResult<IEnumerable<MallaRequisitosDTO>>> ReemplazarRequisitos([FromBody] ReemplazarRequisitosDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ReemplazarRequisitosCommand(dto), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteMallaRequisitosCommand(id), cancellationToken);
        if (!result) return NotFound();
        return Ok(result);
    }

    [HttpDelete("ByMalla/{idMalla}")]
    
    public async Task<ActionResult<bool>> DeleteByMalla(int idMalla, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteRequisitosDemallaCommand(idMalla), cancellationToken);
        if (!result) return NotFound();
        return Ok(result);
    }
}
