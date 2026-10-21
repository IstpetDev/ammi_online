using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs;

[ApiController]
[Route("api/[controller]")]
public class PlantillaEstructuraController : ControllerBase
{
    private readonly IMediator _mediator;

    public PlantillaEstructuraController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("Arbol/{idPlantilla}")]
    public async Task<ActionResult<List<PlantillaEstructuraDTO>>> GetArbol(int idPlantilla, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetPlantillaEstructuraArbolQuery(idPlantilla), cancellationToken);
        return Ok(result);
    }

    [HttpGet("Nodos/{idPlantilla}")]
    public async Task<ActionResult<IEnumerable<PlantillaEstructuraDTO>>> GetNodos(int idPlantilla, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetPlantillaEstructuraNodosQuery(idPlantilla), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PlantillaEstructuraDTO>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetPlantillaEstructuraByIdQuery(id), cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("Validar/{idPlantilla}")]
    public async Task<ActionResult<ValidacionPesosDTO>> Validar(int idPlantilla, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetValidacionPesosQuery(idPlantilla), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<PlantillaEstructuraDTO>> Create([FromBody] PlantillaEstructuraCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreatePlantillaEstructuraCommand(dto), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.IdPlantillaEstructura }, result);
    }

    [HttpPost("Completa")]
    public async Task<ActionResult<bool>> CreateCompleta([FromBody] CrearEstructuraCompletaDTO dto, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateEstructuraCompletaCommand(dto), cancellationToken);
        return Ok(result);
    }

    [HttpPut]
    public async Task<ActionResult<PlantillaEstructuraDTO>> Update([FromBody] PlantillaEstructuraUpdateDTO dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new UpdatePlantillaEstructuraCommand(dto.IdPlantillaEstructura, dto), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("Reordenar")]
    public async Task<ActionResult<bool>> Reordenar([FromBody] List<int> idsOrdenados, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ReordenarNodosCommand(idsOrdenados), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeletePlantillaEstructuraCommand(id), cancellationToken);
        if (!result) return NotFound();
        return Ok(result);
    }

    [HttpPost("DuplicarPlantilla/{idOriginal}")]
    
    public async Task<ActionResult<PlantillaEvaluacion>> Duplicar(int idOriginal, [FromQuery] string nuevoNombre, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new DuplicarPlantillaCommand(idOriginal, nuevoNombre), cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
