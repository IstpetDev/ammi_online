using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using AMMI_Online_API.Application.DTOs.Catalogs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs;

[ApiController]
[Route("api/[controller]")]
public class ReglasCalculoController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReglasCalculoController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        return Ok(await _mediator.Send(new GetReglasCalculoByIdQuery(id)));
    }

    [HttpGet("ByEstructura/{idPlantillaEstructura}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByEstructura(int idPlantillaEstructura)
    {
        return Ok(await _mediator.Send(new GetReglasCalculoByPlantillaEstructuraQuery(idPlantillaEstructura)));
    }

    [HttpGet("ByPlantilla/{idPlantillaEvaluacion}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByPlantilla(int idPlantillaEvaluacion)
    {
        return Ok(await _mediator.Send(new GetReglasCalculoByPlantillaEvaluacionQuery(idPlantillaEvaluacion)));
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] ReglasCalculoCreateDTO command)
    {
        return Ok(await _mediator.Send(new CreateReglasCalculoCommand(
            command.IdTipoReglaCalculo,
            command.IdPlantillaEstructura,
            command.NotaMinimaAprobar,
            command.NotaMinimaRecuperar)));
    }

    [HttpPut]
    [AllowAnonymous]
    public async Task<IActionResult> Update([FromBody] ReglasCalculoUpdateDTO command)
    {
        return Ok(await _mediator.Send(new UpdateReglasCalculoCommand(
            command.IdReglasCalculo,
            command.IdTipoReglaCalculo,
            command.NotaMinimaAprobar,
            command.NotaMinimaRecuperar)));
    }

    [HttpDelete("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> Delete(int id)
    {
        return Ok(await _mediator.Send(new DeleteReglasCalculoCommand(id)));
    }
}
