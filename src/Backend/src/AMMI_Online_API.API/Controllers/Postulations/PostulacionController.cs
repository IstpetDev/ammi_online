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
public class PostulacionController : ApiController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<Response<IEnumerable<PostulacionDTO>>> GetPostulaciones(CancellationToken cancellationToken)
        => await Mediator.Send(new GetPostulacionesQuery(), cancellationToken);

    [HttpPut("{id}/malla")]
    [AllowAnonymous]
    public async Task<Response<int>> ActualizarMalla(int id, [FromBody] ActualizarMallaPostulacionDTO dto, CancellationToken cancellationToken)
        => await Mediator.Send(new ActualizarMallaPostulacionCommand(id, dto), cancellationToken);
}
