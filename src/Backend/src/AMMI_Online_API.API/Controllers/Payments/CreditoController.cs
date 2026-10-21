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
    
    public async Task<Response<IEnumerable<CreditoDTO>>> GetCreditosByMatricula(
        int idMatricula,
        CancellationToken cancellationToken)
        => await Mediator.Send(new GetCreditosByMatriculaQuery(idMatricula), cancellationToken);

    [HttpPost("Diferir")]
    
    public async Task<Response<DiferirCreditoResultDTO>> DiferirCredito(
        [FromBody] DiferirCreditoCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);
    
    [HttpGet("GetDetallesCreditoByMatricula/{idMatricula}")]
    
    public async Task<Response<IEnumerable<DetalleCreditoDTO>>> GetDetallesCreditoByMatricula(
        int idMatricula,
        CancellationToken cancellationToken)
        => new Response<IEnumerable<DetalleCreditoDTO>>(await Mediator.Send(new GetDetallesCreditoByMatriculaQuery(idMatricula), cancellationToken));

    [HttpGet("GetDetallesByCredito/{idCredito}")]
    
    public async Task<Response<IEnumerable<DetalleCreditoDTO>>> GetDetallesByCredito(
        int idCredito,
        CancellationToken cancellationToken)
        => await Mediator.Send(new GetDetallesByCreditoQuery(idCredito), cancellationToken);

    [HttpPatch("ActualizarFechaLimiteCuota/{idDetalleCredito}")]
    [Authorize(Roles = "ADMINISTRADOR,SUPERVISOR")]
    public async Task<Response<bool>> ActualizarFechaLimiteCuota(
        int idDetalleCredito,
        [FromBody] ActualizarFechaLimiteCuotaDTO request,
        CancellationToken cancellationToken)
        => await Mediator.Send(new ActualizarFechaLimiteCuotaCommand(idDetalleCredito, request), cancellationToken);

    [HttpPost]
    [HttpPost("/api/Credito")]
    [Authorize(Roles = "ADMINISTRADOR,ADMIN,SECRETARIA-GENERAL")]
    public async Task<Response<CreditoExtraItemDTO>> AsignarCreditoExtra(
        [FromBody] AsignarCreditoExtraDTO request,
        CancellationToken cancellationToken)
        => await Mediator.Send(new AsignarCreditoExtraCommand(request), cancellationToken);

    [HttpPost]
    [HttpPost("/api/Credito/asignar-masivo")]
    [Authorize(Roles = "ADMINISTRADOR,ADMIN,SECRETARIA-GENERAL")]
    public async Task<Response<AsignarCreditoExtraMasivoResultDTO>> AsignarCreditoExtraMasivo(
        [FromBody] AsignarCreditoExtraMasivoDTO request,
        CancellationToken cancellationToken)
        => await Mediator.Send(new AsignarCreditoExtraMasivoCommand(request), cancellationToken);

    [HttpDelete("{idCredito}")]
    [HttpDelete("/api/Credito/{idCredito}")]
    [Authorize(Roles = "ADMINISTRADOR,ADMIN,SECRETARIA-GENERAL")]
    public async Task<Response<bool>> AnularCreditoExtra(
        int idCredito,
        CancellationToken cancellationToken)
        => await Mediator.Send(new AnularCreditoExtraCommand(idCredito), cancellationToken);

    [HttpGet]
    [HttpGet("/api/Credito")]
    [Authorize(Roles = "ADMINISTRADOR,ADMIN,SECRETARIA-GENERAL,MASTER-CONTABILIDAD")]
    public async Task<Response<IEnumerable<CreditoExtraItemDTO>>> GetCreditosExtras(
        [FromQuery] int? idMatricula,
        CancellationToken cancellationToken)
        => await Mediator.Send(new GetCreditosExtrasQuery(idMatricula), cancellationToken);
}
