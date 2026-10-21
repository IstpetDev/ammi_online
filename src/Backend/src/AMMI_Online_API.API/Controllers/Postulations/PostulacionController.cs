using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Postulations;

[Route("api/[controller]")]
[ApiController]
[Authorize]

public class PostulacionController : ApiController
{
    [HttpGet]
    public async Task<Response<PaginatedResult<PostulacionDTO>>> GetPostulaciones(
        [FromQuery] int? idEstado,
        [FromQuery] int? idMalla,
        [FromQuery] int? idCiclo,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var excludeContactoPersona = User.IsInRole("SECRETARIA-GENERAL") || User.IsInRole("SECRETARIA");
        return await Mediator.Send(new GetPostulacionesQuery(idEstado, idMalla, idCiclo, pageNumber, pageSize, excludeContactoPersona, search), cancellationToken);
    }

    [HttpPut("{id}/malla")]
    public async Task<Response<int>> ActualizarMalla(int id, [FromBody] ActualizarMallaPostulacionDTO dto, CancellationToken cancellationToken)
        => await Mediator.Send(new ActualizarMallaPostulacionCommand(id, dto), cancellationToken);

    [HttpDelete("{id}")]
    public async Task<Response<bool>> EliminarPostulacion(int id, CancellationToken cancellationToken)
        => await Mediator.Send(new EliminarPostulacionCommand(id), cancellationToken);

    [HttpPut("{id}/datos-basicos")]
    public async Task<Response<bool>> ActualizarDatosBasicos(int id, [FromBody] ActualizarDatosBasicosPostulanteDTO dto, CancellationToken cancellationToken)
        => await Mediator.Send(new ActualizarDatosBasicosPostulanteCommand(id, dto), cancellationToken);
}
