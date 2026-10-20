using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Payments
{
    [Route("api/[controller]")]
    [ApiController]
    public class PagosController : ApiController
    {
        [HttpGet("historial")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<PagoHistorialDTO>>> GetHistorialPagos([FromQuery] GetHistorialPagosQuery query, CancellationToken cancellationToken)
                => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CrearPagoCredito([FromBody] CreatePagoCommand request, CancellationToken cancellationToken)
                => await Mediator.Send(request, cancellationToken);

        [HttpPut("validar")]
        [AllowAnonymous]
        public async Task<Response<int>> ValidarPago([FromBody] ValidatePagoCommand request, CancellationToken cancellationToken)
            => await Mediator.Send(request, cancellationToken);

        [HttpGet("pendientes")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<PagoDTO>>> GetPagosPendientes([FromQuery] int? idMatricula,[FromQuery] string? documento, CancellationToken cancellationToken)
        {
            var query = new GetPagosPendientesQuery { IdMatricula = idMatricula, Documento = documento };
            return await Mediator.Send(query, cancellationToken);
        }

        [HttpGet("GetPagosByDocumento/{documento}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<Application.DTOs.Payments.PagoDTO>>> GetPagosByDocumento(string documento, CancellationToken cancellationToken)
                => new Response<IEnumerable<Application.DTOs.Payments.PagoDTO>>(await Mediator.Send(new AMMI_Online_API.Application.Features.Payments.Queries.GetPagosByDocumentoQuery(documento), cancellationToken));

        [HttpGet("GetPagosByMatricula/{idMatricula}")]
        [AllowAnonymous]
        public async Task<Response<IEnumerable<Application.DTOs.Payments.PagoDTO>>> GetPagosByMatricula(int idMatricula, CancellationToken cancellationToken)
                => new Response<IEnumerable<Application.DTOs.Payments.PagoDTO>>(await Mediator.Send(new AMMI_Online_API.Application.Features.Payments.Queries.GetPagosByMatriculaQuery(idMatricula), cancellationToken));
    }
}
