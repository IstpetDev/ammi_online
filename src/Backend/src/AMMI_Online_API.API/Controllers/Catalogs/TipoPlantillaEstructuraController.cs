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
public class TipoPlantillaEstructuraController : ControllerBase
{
    private readonly IMediator _mediator;

    public TipoPlantillaEstructuraController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    
    public async Task<ActionResult<IEnumerable<TipoPlantillaEstructuraDTO>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetAllTipoPlantillaEstructurasQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    
    public async Task<ActionResult<TipoPlantillaEstructuraDTO>> Create([FromBody] TipoPlantillaEstructuraCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateTipoPlantillaEstructuraCommand(dto), cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = result.IdTipoPlantillaEstrucutra }, result);
    }

    [HttpPut]
    
    public async Task<ActionResult<TipoPlantillaEstructuraDTO>> Update([FromBody] TipoPlantillaEstructuraUpdateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateTipoPlantillaEstructuraCommand(dto), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteTipoPlantillaEstructuraCommand(id), cancellationToken);
        return Ok(result);
    }
}
