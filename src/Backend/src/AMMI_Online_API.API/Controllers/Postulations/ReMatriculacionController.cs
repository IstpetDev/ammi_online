using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Postulations;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReMatriculacionController : ApiController
{
    /// <summary>
    /// Diagnóstico de re-matriculación para un alumno.
    /// Devuelve: resultado académico, motivo (REPETIR/AVANZAR), malla destino sugerida
    /// y paralelos disponibles. Úsalo antes de ejecutar la re-matrícula.
    /// </summary>
    [HttpGet("{numeroDocumento}/info")]
    public async Task<ActionResult<ReMatriculaInfoDTO>> GetInfo(
        string numeroDocumento,
        [FromQuery] int idCicloDestino,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new GetReMatriculaInfoQuery(numeroDocumento, idCicloDestino), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Ejecuta la re-matriculación de un alumno en el paralelo indicado.
    /// Pasos internos:
    ///   1. Valida calificaciones completas en la matrícula anterior.
    ///   2. Verifica cupo en el paralelo destino.
    ///   3. Cierra la matrícula anterior si CerrarMatriculaAnterior = true.
    ///   4. Genera la nueva matrícula con créditos y beneficios vigentes.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Response<ReMatricularResultDTO>>> ReMatricular(
        [FromBody] ReMatricularCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}
