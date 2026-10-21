using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.DTOs.Catalogs;
using AMMI_Online_API.Application.Features.Catalogs.Commands;
using AMMI_Online_API.Application.Features.Catalogs.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Catalogs;

public class BeneficioController : ApiController
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BeneficioDTO>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetAllBeneficiosQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("ById")]
    public async Task<ActionResult<BeneficioDTO>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetBeneficioByIdQuery(id), cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("ByEspecie")]
    public async Task<ActionResult<IEnumerable<BeneficioDTO>>> GetByIdEspecie(int idEspecie, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetBeneficioByIdEspecie(idEspecie), cancellationToken);
        if (result == null || !result.Any()) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<BeneficioDTO>> Create([FromBody] BeneficioCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new CreateBeneficioCommand(dto), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.IdBeneficio }, result);
    }

    [HttpPut]
    public async Task<ActionResult<BeneficioDTO>> Update([FromBody] BeneficioUpdateDTO dto, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new UpdateBeneficioCommand(dto), cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<bool>> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new DeleteBeneficioCommand(id), cancellationToken);
        return Ok(result);
    }


}
