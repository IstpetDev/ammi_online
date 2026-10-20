using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs;

public class TipoCuentaController : ApiController
{
    [HttpGet]
    
    public async Task<Response<IEnumerable<TipoCuentaDTO>>> GetTipoCuenta([FromQuery] GetTipoCuentaBancariaQuery query, CancellationToken cancellationToken)
        => await Mediator.Send(query, cancellationToken);

    [HttpPost]
    public async Task<Response<int>> CreateTipoCuenta([FromBody] CreateTipoCuentaBancariaCommand command, CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);
    
    [HttpPut]
    public async Task<Response<bool>> UpdateTipoCuenta([FromBody] UpdateTipoCuentaBancariaCommand command, CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    [HttpDelete("{id}")]
    public async Task<Response<bool>> DeleteTipoCuenta(int id, CancellationToken cancellationToken)
        => await Mediator.Send(new DeleteTipoCuentaBancariaCommand(id), cancellationToken);

}
