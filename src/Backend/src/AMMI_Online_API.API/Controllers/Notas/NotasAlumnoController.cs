using AMMI_Online_API.Application.Features.Notas.Commands;
using AMMI_Online_API.Application.Features.Notas.Queries;
using AMMI_Online_API.Application.DTOs.Notas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Notas;

[ApiController]
[Route("api/[controller]")]
public class NotasAlumnoController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotasAlumnoController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        return Ok(await _mediator.Send(new GetNotaAlumnoByIdQuery(id)));
    }

    [HttpGet("ByMatricula/{idMatricula}")]
    [AllowAnonymous]
    [Obsolete("Usar ByDetalleMatricula o ByMatricula/Materia")]
    public async Task<IActionResult> GetByMatricula(int idMatricula)
    {
        return Ok(await _mediator.Send(new GetNotasByMatriculaQuery(idMatricula)));
    }

    [HttpGet("ByMatricula/{idMatricula}/Plantilla/{idPlantillaEvaluacion}")]
    [AllowAnonymous]
    [Obsolete("Usar ByDetalleMatricula")]
    public async Task<IActionResult> GetByMatriculaAndPlantilla(int idMatricula, int idPlantillaEvaluacion)
    {
        return Ok(await _mediator.Send(new GetNotasByMatriculaAndPlantillaQuery(idMatricula, idPlantillaEvaluacion)));
    }

    [HttpGet("ByDetalleMatricula/{idDetalleMatricula}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByDetalleMatricula(int idDetalleMatricula)
    {
        return Ok(await _mediator.Send(new GetNotasByDetalleMatriculaQuery(idDetalleMatricula)));
    }

    [HttpGet("ByMatricula/{idMatricula}/Materia/{idDetalleMalla}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByMatriculaAndMateria(int idMatricula, int idDetalleMalla)
    {
        return Ok(await _mediator.Send(new GetNotasByMatriculaYMateriaQuery(idMatricula, idDetalleMalla)));
    }

    [HttpGet("Boletin/{idMatricula}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBoletin(int idMatricula)
    {
        return Ok(await _mediator.Send(new GetBoletinQuery(idMatricula)));
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] NotasAlumnoCreateDTO command)
    {
        return Ok(await _mediator.Send(new CreateNotaAlumnoCommand(
            command.IdDetalleMatricula,
            command.IdPlantillaEstructura,
            command.ValorNota,
            command.Observacion)));
    }

    [HttpPost("Masivo")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateMasivo([FromBody] NotasMasivasDTO command)
    {
        return Ok(await _mediator.Send(new CreateNotasMasivasCommand(command)));
    }

    [HttpPut]
    [AllowAnonymous]
    public async Task<IActionResult> Update([FromBody] NotasAlumnoUpdateDTO command)
    {
        return Ok(await _mediator.Send(new UpdateNotaAlumnoCommand(
            command.IdNotasAlumno,
            command.ValorNota,
            command.Observacion)));
    }

    [HttpDelete("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> Delete(int id)
    {
        return Ok(await _mediator.Send(new DeleteNotaAlumnoCommand(id)));
    }

    [HttpPost("Recalcular/{idDetalleMatricula}")]
    [AllowAnonymous]
    public async Task<IActionResult> Recalcular(int idDetalleMatricula)
    {
        return Ok(await _mediator.Send(new RecalcularNotasCommand(idDetalleMatricula)));
    }

    [HttpGet("ByParaleloAndEstructura/{idParalelo}/{idPlantillaEstructura}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNotasByParaleloAndEstructura(int idParalelo, int idPlantillaEstructura)
    {
        return Ok(await _mediator.Send(new GetNotasByParaleloAndEstructuraQuery(idParalelo, idPlantillaEstructura)));
    }

    [HttpGet("ResumenParalelo/{idParalelo}/{idDetalleMalla}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetResumenParalelo(int idParalelo, int idDetalleMalla)
    {
        return Ok(await _mediator.Send(new GetResumenNotasParaleloQuery(idParalelo, idDetalleMalla)));
    }
}
