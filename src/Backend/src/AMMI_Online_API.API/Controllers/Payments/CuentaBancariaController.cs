using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Payments;

public class CuentaBancariaController : ApiController
{
    [HttpGet]
    public async Task<Response<IEnumerable<CuentaBancariaDTO>>> GetCuentaBancaria([FromQuery] GetCuentaBancariaQuery query, CancellationToken cancellationToken)
        => await Mediator.Send(query, cancellationToken);

    [HttpPost]
    public async Task<Response<int>> CreateCuentaBancaria([FromBody] CreateCuentaBancariaCommand command, CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    [HttpPut]
    public async Task<Response<bool>> UpdateCuentaBancaria([FromBody] UpdateCuentaBancariaCommand command, CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    [HttpDelete("{id}/desactivar")]
    public async Task<Response<bool>> DeactivateCuentaBancaria(int id, CancellationToken cancellationToken)
        => await Mediator.Send(new DesactivateCuentaBancariaCommand(id), cancellationToken);
}
