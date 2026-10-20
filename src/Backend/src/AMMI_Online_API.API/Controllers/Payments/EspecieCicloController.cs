using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Payments;

[Route("api/[controller]")]
[ApiController]
public class EspecieCicloController : ApiController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<Response<IEnumerable<EspecieCicloDTO>>> GetAll(
        CancellationToken cancellationToken)
        => await Mediator.Send(new GetAllEspecieCicloQuery(), cancellationToken);

    [HttpGet("ciclo/{idCiclo}")]
    [AllowAnonymous]
    public async Task<Response<IEnumerable<EspecieCicloDTO>>> GetByCiclo(
        int idCiclo,
        CancellationToken cancellationToken)
        => await Mediator.Send(new GetEspecieCicloByCicloQuery(idCiclo), cancellationToken);

    [HttpGet("{idEspecieCiclo}")]
    [AllowAnonymous]
    public async Task<Response<EspecieCicloDTO>> GetById(
        int idEspecieCiclo,
        CancellationToken cancellationToken)
        => await Mediator.Send(new GetEspecieCicloByIdQuery(idEspecieCiclo), cancellationToken);

    [HttpPost]
    [Authorize]
    public async Task<Response<EspecieCicloDTO>> Create(
        [FromBody] CreateEspecieCicloCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    [HttpPut]
    [Authorize]
    public async Task<Response<EspecieCicloDTO>> UpdateValor(
        [FromBody] UpdateEspecieCicloValorCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);
}
