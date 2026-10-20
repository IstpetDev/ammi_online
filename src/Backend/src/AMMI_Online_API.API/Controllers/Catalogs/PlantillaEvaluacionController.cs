using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs;

[ApiController]
[Route("api/[controller]")]
public class PlantillaEvaluacionController : ControllerBase
{
    private readonly IMediator _mediator;

    public PlantillaEvaluacionController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PlantillaEvaluacionDTO>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetAllPlantillasEvaluacionQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("activos")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PlantillaEvaluacionDTO>>> GetActivos(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetPlantillasEvaluacionActivasQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<PlantillaEvaluacionDTO>> Create([FromBody] PlantillaEvaluacionCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreatePlantillaEvaluacionCommand(dto), cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = result.IdPlantillaEvaluacion }, result);
    }

    [HttpPut]
    [AllowAnonymous]
    public async Task<ActionResult<PlantillaEvaluacionDTO>> Update([FromBody] PlantillaEvaluacionUpdateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdatePlantillaEvaluacionCommand(dto), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeletePlantillaEvaluacionCommand(id), cancellationToken);
        return Ok(result);
    }
}
