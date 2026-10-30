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
public class RequisitosController : ControllerBase
{
    private readonly IMediator _mediator;

    public RequisitosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    
    public async Task<ActionResult<IEnumerable<RequisitosDTO>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetAllRequisitosQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("GetRequisitosByMalla/{idMalla}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<RequisitosDTO>>> GetByMalla(int idMalla, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetRequisitosByMallaQuery(idMalla), cancellationToken);
        return Ok(result);
    }



    [HttpPost]
    
    public async Task<ActionResult<RequisitosDTO>> Create([FromBody] RequisitosCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateRequisitosCommand(dto), cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = result.IdRequisitos }, result);
    }

    [HttpPut]
    
    public async Task<ActionResult<RequisitosDTO>> Update([FromBody] RequisitosUpdateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateRequisitosCommand(dto), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteRequisitosCommand(id), cancellationToken);
        return Ok(result);
    }
}
