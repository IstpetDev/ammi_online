using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Application.DTOs.Catalogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.API.Controllers.Catalogs;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EstadoMatriculaController : ControllerBase
{
    private readonly IEstadoMatriculaRepository _repository;

    public EstadoMatriculaController(IEstadoMatriculaRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EstadoMatriculaDTO>>> GetAll(CancellationToken ct)
    {
        var entities = await _repository.GetAllAsync(ct);
        return Ok(entities.Select(e => new EstadoMatriculaDTO
        {
            IdEstadoMatricula = e.IdEstadoMatricula,
            Detalle = e.Detalle,
            Completado = e.Completado
        }));
    }
}
