using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Infrastructure;

[ApiController]
[Route("api/[controller]")]
public class ContenidoMallaController : ControllerBase
{
    private readonly IMediator _mediator;

    public ContenidoMallaController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ContenidoMallaDTO>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetContenidoMallaByIdQuery(id), cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("ByDetalleMalla/{idDetalleMalla}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ContenidoMallaDTO>>> GetByDetalleMalla(int idDetalleMalla, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetContenidoMallaByDetalleMallaQuery(idDetalleMalla), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ContenidoMallaDTO>> Create([FromForm] ContenidoMallaCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateContenidoMallaCommand(dto), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.IdContenidoMalla }, result);
    }

    [HttpPut]
    [AllowAnonymous]
    public async Task<ActionResult<ContenidoMallaDTO>> Update([FromForm] ContenidoMallaUpdateDTO dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new UpdateContenidoMallaCommand(dto.IdContenidoMalla, dto), cancellationToken);
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
        var result = await _mediator.Send(new DeleteContenidoMallaCommand(id), cancellationToken);
        if (!result) return NotFound();
        return Ok(result);
    }
}
