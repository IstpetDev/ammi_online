using AMMI_Online_API.Application.Features.Notas.Commands;
using AMMI_Online_API.Application.Features.Notas.Queries;
using AMMI_Online_API.Application.DTOs.Notas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Notas;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotasAlumnoController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotasAlumnoController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    
    public async Task<IActionResult> GetById(int id)
    {
        return Ok(await _mediator.Send(new GetNotaAlumnoByIdQuery(id)));
    }

    [HttpGet("ByDetalleMatricula/{idDetalleMatricula}")]
    
    public async Task<IActionResult> GetByDetalleMatricula(int idDetalleMatricula)
    {
        return Ok(await _mediator.Send(new GetNotasByDetalleMatriculaQuery(idDetalleMatricula)));
    }

    [HttpGet("ByMatricula/{idMatricula}/Materia/{idDetalleMalla}")]
    
    public async Task<IActionResult> GetByMatriculaAndMateria(int idMatricula, int idDetalleMalla)
    {
        return Ok(await _mediator.Send(new GetNotasByMatriculaYMateriaQuery(idMatricula, idDetalleMalla)));
    }

    [HttpGet("Boletin/{idMatricula}")]
    
    public async Task<IActionResult> GetBoletin(int idMatricula)
    {
        return Ok(await _mediator.Send(new GetBoletinQuery(idMatricula)));
    }

    [HttpPost]
    
    public async Task<IActionResult> Create([FromBody] NotasAlumnoCreateDTO command)
    {
        return Ok(await _mediator.Send(new CreateNotaAlumnoCommand(
            command.IdDetalleMatricula,
            command.IdPlantillaEstructura,
            command.ValorNota,
            command.Observacion)));
    }

    [HttpPost("Masivo")]
    
    public async Task<IActionResult> CreateMasivo([FromBody] NotasMasivasDTO command)
    {
        return Ok(await _mediator.Send(new CreateNotasMasivasCommand(command)));
    }

    [HttpPut]
    
    public async Task<IActionResult> Update([FromBody] NotasAlumnoUpdateDTO command)
    {
        return Ok(await _mediator.Send(new UpdateNotaAlumnoCommand(
            command.IdNotasAlumno,
            command.ValorNota,
            command.Observacion)));
    }

    [HttpDelete("{id}")]
    
    public async Task<IActionResult> Delete(int id)
    {
        return Ok(await _mediator.Send(new DeleteNotaAlumnoCommand(id)));
    }

    [HttpPost("Recalcular/{idDetalleMatricula}")]
    
    public async Task<IActionResult> Recalcular(int idDetalleMatricula)
    {
        return Ok(await _mediator.Send(new RecalcularNotasCommand(idDetalleMatricula)));
    }

    [HttpGet("ByMallaParalelo/{idMallaParalelo}")]
    public async Task<IActionResult> GetByParalelo(
        int idMallaParalelo,
        [FromQuery] int? idDetalleMatricula,
        [FromQuery] int? idDetalleMalla,
        [FromQuery] int? idMatricula)
    {
        return Ok(await _mediator.Send(new GetNotasByParaleloQuery(idMallaParalelo, idDetalleMatricula, idDetalleMalla, idMatricula)));
    }

    [HttpGet("Actas/{idMallaParalelo}")]
    public async Task<IActionResult> GetActas(
        int idMallaParalelo,
        [FromQuery] int? idDetalleMalla)
    {
        return Ok(await _mediator.Send(new GetActasParaleloQuery(idMallaParalelo, idDetalleMalla)));
    }
}
