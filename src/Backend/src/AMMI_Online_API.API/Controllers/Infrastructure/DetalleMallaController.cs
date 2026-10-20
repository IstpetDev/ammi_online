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
public class DetalleMallaController : ControllerBase
{
    private readonly IMediator _mediator;

    public DetalleMallaController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<DetalleMallaDTO>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetDetalleMallaByIdQuery(id), cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("ByMalla/{idMalla}")]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedResult<DetalleMallaDTO>>> GetByMalla(int idMalla, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetDetalleMallaByMallaIdQuery(idMalla, pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<DetalleMallaDTO>> Create([FromBody] DetalleMallaCreateDTO dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new CreateDetalleMallaCommand(dto), cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.IdDetalleMalla }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("Bulk")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<DetalleMallaDTO>>> CreateBulk([FromBody] List<DetalleMallaCreateDTO> dtos, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateBulkDetalleMallaCommand(dtos), cancellationToken);
        return Ok(result);
    }

    [HttpPut]
    [AllowAnonymous]
    public async Task<ActionResult<DetalleMallaDTO>> Update([FromBody] DetalleMallaUpdateDTO dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new UpdateDetalleMallaCommand(dto.IdDetalleMalla, dto), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteDetalleMallaCommand(id), cancellationToken);
        if (!result) return NotFound();
        return Ok(result);
    }
}
