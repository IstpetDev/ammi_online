using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Payments;

[Route("api/[controller]")]
public class SaldoFavorController : ApiController
{
    [HttpGet("{idPersona}")]
    [AllowAnonymous]
    public async Task<Response<SaldoFavorDTO>> GetSaldoFavor(int idPersona, CancellationToken cancellationToken)
        => await Mediator.Send(new GetSaldoFavorQuery(idPersona), cancellationToken);

    [HttpPost("Aplicar")]
    [AllowAnonymous]
    public async Task<Response<SaldoFavorDTO>> AplicarSaldoFavor([FromBody] AplicarSaldoFavorRequestDTO dto, CancellationToken cancellationToken)
        => await Mediator.Send(new AplicarSaldoFavorCommand(dto.IdPersona, dto.IdDetalleCredito, dto.Monto), cancellationToken);
}
