using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs;

public class EspecieController : ApiController
{

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EspecieDTO>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetAllEspeciesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<EspecieDTO>> Create([FromBody] EspecieCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new CreateEspecieCommand(dto), cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = result.IdEspecie }, result);
    }

    [HttpPut]
    public async Task<ActionResult<EspecieDTO>> Update([FromBody] EspecieUpdateDTO dto, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new UpdateEspecieCommand(dto), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new DeleteEspecieCommand(id), cancellationToken);
        return Ok(result);
    }
}
