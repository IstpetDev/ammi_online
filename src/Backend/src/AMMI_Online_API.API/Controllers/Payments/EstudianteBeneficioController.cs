using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Payments;

public class EstudianteBeneficioController : ApiController
{
    /// <summary>
    /// Lista todos los beneficios (activos e inactivos) asignados a un alumno.
    /// </summary>
    [HttpGet("ByAlumno/{idPersona:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByAlumno(int idPersona, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetBeneficiosByAlumnoQuery(idPersona), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Asigna un beneficio a un alumno.
    /// Si el beneficio tiene RequiereRenovacion = true, IdCiclo es obligatorio en el body.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Asignar(
        [FromBody] EstudianteBeneficioCreateDTO dto,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new AsignarBeneficioCommand(dto), cancellationToken);
        if (!result.IsSuccess) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Desactiva (soft delete) una asignación de beneficio.
    /// Opcionalmente recibe el motivo en Observaciones.
    /// </summary>
    [HttpPut("Desactivar")]
    [AllowAnonymous]
    public async Task<IActionResult> Desactivar(
        [FromBody] EstudianteBeneficioDesactivarDTO dto,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new DesactivarBeneficioCommand(dto), cancellationToken);
        if (!result.IsSuccess) return BadRequest(result);
        return Ok(result);
    }
}
