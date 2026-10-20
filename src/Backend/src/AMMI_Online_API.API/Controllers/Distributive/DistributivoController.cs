using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Distributive;
using AMMI_Online_API.Application.Features.Distributivo.Queries;
using AMMI_Online_API.Application.Features.Distributivo.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Distributive;

[ApiController]
[Route("api/[controller]")]
public class DistributivoController : ControllerBase
{
    private readonly IMediator _mediator;

    public DistributivoController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _mediator.Send(new GetAllDistributivosQuery()));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        return Ok(await _mediator.Send(new GetDistributivoByIdQuery(id)));
    }

    [HttpGet("ByDocente/{idPersona}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByDocente(int idPersona)
    {
        return Ok(await _mediator.Send(new GetAsignacionesDocenteQuery(idPersona)));
    }

    [HttpGet("ByParalelo/{idParalelo}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByParalelo(int idParalelo)
    {
        return Ok(await _mediator.Send(new GetDistributivoByParaleloQuery(idParalelo)));
    }

    [HttpPost]
    public async Task<IActionResult> Create(DistributivoCreateDTO data)
    {
        return Ok(await _mediator.Send(new CreateDistributivoCommand(data)));
    }

    [HttpPut]
    public async Task<IActionResult> Update(DistributivoUpdateDTO data)
    {
        return Ok(await _mediator.Send(new UpdateDistributivoCommand(data)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        return Ok(await _mediator.Send(new DeleteDistributivoCommand(id)));
    }

    [HttpPost("Masivo")]
    public async Task<IActionResult> CreateMasivo(DistributivoMasivoDTO data)
    {
        return Ok(await _mediator.Send(new CreateDistributivoMasivoCommand(data)));
    }

    [HttpGet("ByMalla/{idMalla}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByMalla(int idMalla, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        return Ok(await _mediator.Send(new GetDistributivoByMallaQuery(idMalla, pageNumber, pageSize)));
    }

    [HttpGet("ByCiclo/{idCiclo}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByCiclo(int idCiclo, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        return Ok(await _mediator.Send(new GetDistributivoByCicloQuery(idCiclo, pageNumber, pageSize)));
    }

    [HttpGet("CargaDocente/{idPersona}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCargaDocente(int idPersona)
    {
        return Ok(await _mediator.Send(new GetCargaDocenteQuery(idPersona)));
    }

    [HttpGet("Docentes")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDocentesDisponibles()
    {
        return Ok(await _mediator.Send(new GetDocentesDisponiblesQuery()));
    }
}
