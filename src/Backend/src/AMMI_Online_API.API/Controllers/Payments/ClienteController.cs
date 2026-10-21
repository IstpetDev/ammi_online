using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Payments.Commands;
using AMMI_Online_API.Application.Features.Payments.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Payments;

public class ClienteController : ApiController
{
    [HttpGet]
    
    public async Task<Response<IEnumerable<ClienteDTO>>> GetClientes(
        [FromQuery] ClienteQuery query,
        CancellationToken cancellationToken)
        => await Mediator.Send(query, cancellationToken);

    [HttpPost]
    
    public async Task<Response<int>> CreateCliente(
        [FromBody] CreateClienteCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    [HttpPut]
    
    public async Task<Response<bool>> UpdateCliente(
        [FromBody] UpdateClienteCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    [HttpDelete("{id}/desactivar")]
    public async Task<Response<bool>> DeactivateCliente(int id, CancellationToken cancellationToken)
        => await Mediator.Send(new DeleteClienteCommand(id), cancellationToken);
}
