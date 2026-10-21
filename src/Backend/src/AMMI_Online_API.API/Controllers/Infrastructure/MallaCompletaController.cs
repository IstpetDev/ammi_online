using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace AMMI_Online_API.API.Controllers.Infrastructure;

[ApiController]
[Route("api/[controller]")]
public class MallaCompletaController : ApiController
{
    private readonly IMediator _mediator;

    public MallaCompletaController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Crea de forma atómica todo lo necesario para una malla.
    /// El Periodo y Regimen deben existir previamente; se reciben sus IDs en el objeto Ciclo.
    /// Flujo: Ciclo → Malla → MallaRequisitos
    /// → DetalleMalla (una por materia, cada una con su PlantillaEvaluacion)
    /// → 2 EspecieCiclo
    /// y opcionalmente: MallaParalelo + Distributivos para un paralelo.
    /// </summary>
    [HttpPost("Crear")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<CrearMallaCompletaResultDTO>>> Crear(
        [FromBody] CrearMallaCompletaRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Especies.Count != 2)
            return BadRequest(Response<CrearMallaCompletaResultDTO>.Failure(
                "Se deben proporcionar exactamente 2 especies para el ciclo."));

        if (request.Materias.Count == 0)
            return BadRequest(Response<CrearMallaCompletaResultDTO>.Failure(
                "La malla debe tener al menos una materia."));

        if (!request.CrearCiclo && request.IdCiclo is null)
            return BadRequest(Response<CrearMallaCompletaResultDTO>.Failure(
                "IdCiclo es requerido cuando CrearCiclo es false."));

        var result = await _mediator.Send(new CrearMallaCompletaCommand(request), cancellationToken);
        return Ok(Response<CrearMallaCompletaResultDTO>.Success(result, "Malla completa creada exitosamente."));
    }

    /// <summary>
    /// Duplica la estructura de una malla (DetalleMalla + MallaRequisitos) en un ciclo destino.
    /// Reglas:
    ///   - El ciclo destino debe existir y estar activo (EsActivo = true).
    ///   - No debe existir ya una malla con el mismo IdCursos + IdTipoOferta en ese ciclo.
    /// Si alguna condición falla, se hace rollback completo y no se persiste nada.
    /// </summary>
    [HttpPost("Duplicar")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<DuplicarMallaResultDTO>>> Duplicar(
        [FromBody] DuplicarMallaRequest request,
        CancellationToken cancellationToken)
    {


        try
        {
            var result = await _mediator.Send(new DuplicarMallaCommand(request), cancellationToken);
            return Ok(Response<DuplicarMallaResultDTO>.Success(result, "Malla duplicada exitosamente."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(Response<DuplicarMallaResultDTO>.Failure(ex.Message));
        }
    }

    /// <summary>
    /// Clona todas las mallas de un ciclo origen en un ciclo destino (proceso de Apertura de Ciclo).
    /// Por cada malla clona: DetalleMalla + MallaRequisitos + EspecieCiclo.
    /// Si ClonarParalelos = true, también clona los MallaParalelo con sus cupos.
    /// La operación es atómica; si algo falla se hace rollback completo.
    /// Reglas:
    ///   - El ciclo destino debe existir y estar activo.
    ///   - No deben existir ya mallas con los mismos cursos en el ciclo destino.
    /// </summary>
    [HttpPost("ClonarParaCiclo")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<ClonarMallasResultDTO>>> ClonarParaCiclo(
        [FromBody] ClonarMallasParaCicloRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new ClonarMallasParaCicloCommand(request), cancellationToken);
            return Ok(Response<ClonarMallasResultDTO>.Success(result, "Mallas clonadas exitosamente."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(Response<ClonarMallasResultDTO>.Failure(ex.Message));
        }
    }

    /// <summary>
    /// Obtiene el estado de configuración de los cursos para un ciclo y tipo de oferta específicos.
    /// </summary>
    [HttpPost("configuracion-cursos")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<IEnumerable<CursoConfigStatusDTO>>>> GetConfiguracionCursos(
        [FromBody] CursoConfigRequestDTO request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetConfiguracionCursosQuery(request), cancellationToken);
        return Ok(Response<IEnumerable<CursoConfigStatusDTO>>.Success(result, "Consulta de configuración de cursos exitosa."));
    }
}
