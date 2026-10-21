using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Infrastructure;
using AMMI_Online_API.Application.Features.Infrastructure.Commands;
using AMMI_Online_API.Application.Features.Infrastructure.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.API.Controllers.Infrastructure;

public class MallaParaleloController : ApiController
{
    [HttpPost]
    public async Task<Response<int>> Crear([FromBody] CrearMallaParaleloDTO data, CancellationToken ct)
    {
        return await Mediator.Send(new CrearMallaParaleloCommand(data), ct);
    }

    [HttpPut("{id}/activar")]
    public async Task<Response<bool>> ActivarMallaParalelo(int id, [FromBody] ActivarMallaParaleloDTO data, CancellationToken ct)
    {
        var commandData = data with { IdMallaParalelo = id };
        return await Mediator.Send(new ActivarMallaParaleloCommand(commandData), ct);
    }

    [HttpPut("{id}/desactivar")]
    public async Task<Response<bool>> DesactivarMallaParalelo(int id, CancellationToken ct)
    {
        return await Mediator.Send(new DesactivarMallaParaleloCommand(id), ct);
    }
    
    [HttpGet("ByMalla/{idMalla}")]
    public async Task<Response<IEnumerable<MallaParaleloDTO>>> GetByMalla(int idMalla, CancellationToken ct)
    {
        return await Mediator.Send(new GetMallaParaleloByMallaQuery(idMalla), ct);
    }
}
