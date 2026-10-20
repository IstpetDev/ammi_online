using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Payments;

public class CreditoController : ApiController
{
    [HttpGet("GetCreditosByMatricula/{idMatricula}")]
    [AllowAnonymous]
    public async Task<Response<IEnumerable<CreditoDTO>>> GetCreditosByMatricula(
        int idMatricula,
        CancellationToken cancellationToken)
        => await Mediator.Send(new GetCreditosByMatriculaQuery(idMatricula), cancellationToken);

    [HttpPost("Diferir")]
    [AllowAnonymous]
    public async Task<Response<DiferirCreditoResultDTO>> DiferirCredito(
        [FromBody] DiferirCreditoCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);
    
    [HttpGet("GetDetallesCreditoByMatricula/{idMatricula}")]
    [AllowAnonymous]
    public async Task<Response<IEnumerable<DetalleCreditoDTO>>> GetDetallesCreditoByMatricula(
        int idMatricula,
        CancellationToken cancellationToken)
        => new Response<IEnumerable<DetalleCreditoDTO>>(await Mediator.Send(new GetDetallesCreditoByMatriculaQuery(idMatricula), cancellationToken));

    [HttpGet("GetDetallesByCredito/{idCredito}")]
    [AllowAnonymous]
    public async Task<Response<IEnumerable<DetalleCreditoDTO>>> GetDetallesByCredito(
        int idCredito,
        CancellationToken cancellationToken)
        => await Mediator.Send(new GetDetallesByCreditoQuery(idCredito), cancellationToken);
}
