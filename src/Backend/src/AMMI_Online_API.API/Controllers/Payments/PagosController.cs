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
[Authorize]
public class PagosController : ApiController
{
    [HttpGet("historial")]
    public async Task<Response<IEnumerable<PagoHistorialDTO>>> GetHistorialPagos([FromQuery] GetHistorialPagosQuery query, CancellationToken cancellationToken)
        => await Mediator.Send(query, cancellationToken);

    [HttpPost]
    public async Task<Response<int>> CrearPagoCredito([FromForm] CreatePagoCommand request, CancellationToken cancellationToken)
        => await Mediator.Send(request, cancellationToken);

    [HttpPut("cancelar")]
    [Authorize(Roles = "MASTER-CONTABILIDAD")]
    public async Task<Response<int>> CancelarPago([FromBody] CancelPagoCommand request, CancellationToken cancellationToken)
        =>  await Mediator.Send(request, cancellationToken);

    [HttpPut("aprobar")]
    [Authorize(Roles = "SECRETARIA-GENERAL")]
    public async Task<Response<int>> AprobarPago([FromBody] AprobarPagoCommand request, CancellationToken cancellationToken)
        => await Mediator.Send(request, cancellationToken);

    [HttpPut("rechazar")]
    [Authorize(Roles = "SECRETARIA-GENERAL")]
    public async Task<Response<int>> RechazarPago([FromBody] RechazarPagoCommand request, CancellationToken cancellationToken)
        => await Mediator.Send(request, cancellationToken);

    [HttpPut("actualizar-observacion")]
    public async Task<Response<int>> ActualizarObservacion([FromBody] ActualizarObservacionPagoCommand request, CancellationToken cancellationToken)
        => await Mediator.Send(request, cancellationToken);


    [HttpGet("pendientes")]
    public async Task<Response<IEnumerable<PagoDTO>>> GetPagosPendientes([FromQuery] int? idMatricula, [FromQuery] string? documento, CancellationToken cancellationToken)
    {
        var query = new GetPagosPendientesQuery { IdMatricula = idMatricula, DocumentoCliente = documento };
        return await Mediator.Send(query, cancellationToken);
    }

    [HttpGet("GetPagosByDocumento/{documento}")]
    public async Task<Response<IEnumerable<PagoDTO>>> GetPagosByDocumento(string documento, CancellationToken cancellationToken)
        => new Response<IEnumerable<PagoDTO>>(await Mediator.Send(new GetPagosByDocumentoQuery(documento), cancellationToken));

    [HttpGet("GetPagosByMatricula/{idMatricula}")]
    public async Task<Response<IEnumerable<PagoDTO>>> GetPagosByMatricula(int idMatricula, CancellationToken cancellationToken)
        => new Response<IEnumerable<PagoDTO>>(await Mediator.Send(new GetPagosByMatriculaQuery(idMatricula), cancellationToken));
}