using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Distributive;
using AMMI_Online_API.Application.Features.Distributivo.Queries;
using AMMI_Online_API.Application.Features.Distributivo.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Distributive;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DistributivoController : ControllerBase
{
    private readonly IMediator _mediator;

    public DistributivoController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _mediator.Send(new GetAllDistributivosQuery()));
    }

    [HttpGet("{id}")]
    
    public async Task<IActionResult> GetById(int id)
    {
        return Ok(await _mediator.Send(new GetDistributivoByIdQuery(id)));
    }

    [HttpGet("ByDocente/{idPersona}")]
    
    public async Task<IActionResult> GetByDocente(int idPersona)
    {
        return Ok(await _mediator.Send(new GetAsignacionesDocenteQuery(idPersona)));
    }

    [HttpGet("ByMallaParalelo/{idMallaParalelo}")]
    
    public async Task<IActionResult> GetByMallaParalelo(int idMallaParalelo)
    {
        return Ok(await _mediator.Send(new GetDistributivoByMallaParaleloQuery(idMallaParalelo)));
    }

    [HttpPost]
    public async Task<IActionResult> Create(DistributivoCreateDTO data)
    {
        return Ok(await _mediator.Send(new CreateDistributivoCommand(data)));
    }

    [HttpPut]
    public async Task<IActionResult> Update(DistributivoUpdateDTO data)
    {
        return Ok(await _mediator.Send(new UpdateDistributivoCommand(data)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        return Ok(await _mediator.Send(new DeleteDistributivoCommand(id)));
    }

    [HttpPost("Masivo")]
    public async Task<IActionResult> CreateMasivo(DistributivoMasivoDTO data)
    {
        return Ok(await _mediator.Send(new CreateDistributivoMasivoCommand(data)));
    }

    [HttpGet("ByMalla/{idMalla}")]
    
    public async Task<IActionResult> GetByMalla(int idMalla, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        return Ok(await _mediator.Send(new GetDistributivoByMallaQuery(idMalla, pageNumber, pageSize)));
    }

    [HttpGet("ByCiclo/{idCiclo}")]
    public async Task<IActionResult> GetByCiclo(int idCiclo)
    {
        return Ok(await _mediator.Send(new GetDistributivoByCicloQuery(idCiclo)));
    }

    [HttpGet("ByCiclo/{idCiclo}/Agrupado")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByCicloAgrupado(int idCiclo)
    {
        return Ok(await _mediator.Send(new GetDistributivoByCicloAgrupadoQuery(idCiclo)));
    }

    [HttpGet("CargaDocente/{idPersona}")]
    
    public async Task<IActionResult> GetCargaDocente(int idPersona)
    {
        return Ok(await _mediator.Send(new GetCargaDocenteQuery(idPersona)));
    }

    [HttpGet("Docentes")]
    
    public async Task<IActionResult> GetDocentesDisponibles()
    {
        return Ok(await _mediator.Send(new GetDocentesDisponiblesQuery()));
    }

    [HttpPut("{id}/desactivar")]
    public async Task<IActionResult> Desactivar(int id)
    {
        return Ok(await _mediator.Send(new DesactivarDistributivoCommand(id)));
    }

    [HttpPut("{id}/activar")]
    public async Task<IActionResult> Activar(int id)
    {
        return Ok(await _mediator.Send(new ActivarDistributivoCommand(id)));
    }

    [HttpGet("ByMalla/{idMalla}/SlotsSinDocente")]
    
    public async Task<IActionResult> GetSlotsSinDocente(int idMalla)
    {
        return Ok(await _mediator.Send(new GetSlotsSinDocenteByMallaQuery(idMalla)));
    }

    [HttpPost("Clonar")]
    public async Task<IActionResult> Clonar(int idMallaParaleloOrigen, int idMallaParaleloDestino)
    {
        return Ok(await _mediator.Send(new ClonarDistributivosCommand(idMallaParaleloOrigen, idMallaParaleloDestino)));
    }

    [HttpGet("Filtrar")]
    
    public async Task<IActionResult> Filtrar(
        [FromQuery] int? idMalla,
        [FromQuery] int? idMallaParalelo,
        [FromQuery] int? idDetalleMalla,
        [FromQuery] bool? soloActivos,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        return Ok(await _mediator.Send(new GetDistributivoFiltradoQuery(idMalla, idMallaParalelo, idDetalleMalla, soloActivos, pageNumber, pageSize)));
    }

    [HttpGet("CargaDocente/Documento/{documento}")]
    
    public async Task<IActionResult> GetCargaDocenteByDocumento(string documento)
    {
        return Ok(await _mediator.Send(new GetCargaDocenteByDocumentoQuery(documento)));
    }
}
