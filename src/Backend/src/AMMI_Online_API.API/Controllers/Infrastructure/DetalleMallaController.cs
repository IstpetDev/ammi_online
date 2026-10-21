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
[Authorize]
public class DetalleMallaController : ControllerBase
{
    private readonly IMediator _mediator;

    public DetalleMallaController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    
    public async Task<ActionResult<DetalleMallaDTO>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetDetalleMallaByIdQuery(id), cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("ByMalla/{idMalla}")]
    
    public async Task<ActionResult<PaginatedResult<DetalleMallaDTO>>> GetByMalla(int idMalla, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetDetalleMallaByMallaIdQuery(idMalla, pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpGet("ByMalla/{idMalla}/PorModulo")]
    
    public async Task<ActionResult<IEnumerable<DetalleMallaModuloDTO>>> GetByMallaGroupedByModulo(int idMalla, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetDetalleMallaPorModuloQuery(idMalla), cancellationToken);
        return Ok(result);
    }

    [HttpGet("FechasSugeridas")]
    public async Task<ActionResult<FechasSugeridasModuloDTO>> GetFechasSugeridasModulo(
        [FromQuery] int idCiclo,
        [FromQuery] int modulo,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetFechasSugeridasModuloQuery(idCiclo, modulo), cancellationToken);
        return Ok(result);
    }


    [HttpPost]

    
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
    
    public async Task<ActionResult<IEnumerable<DetalleMallaDTO>>> CreateBulk([FromBody] List<DetalleMallaCreateDTO> dtos, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateBulkDetalleMallaCommand(dtos), cancellationToken);
        return Ok(result);
    }

    [HttpPut]
    
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

    [HttpPut("{id}/FechasNotas")]
    public async Task<ActionResult<DetalleMallaDTO>> ActualizarFechasNotas(int id, [FromBody] ActualizarFechasNotasMateriaDTO dto, CancellationToken cancellationToken)
    {
        if (id != dto.IdDetalleMalla)
            return BadRequest("El ID de la ruta no coincide con el cuerpo de la solicitud.");

        try
        {
            var result = await _mediator.Send(new ActualizarFechasNotasMateriaCommand(dto), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Materia no encontrada");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteDetalleMallaCommand(id), cancellationToken);
        if (!result) return NotFound();
        return Ok(result);
    }
}
