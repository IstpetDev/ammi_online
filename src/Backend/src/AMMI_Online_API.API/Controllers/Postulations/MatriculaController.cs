using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.DTOs.Notas;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Application.Features.Notas.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Postulations;

[Route("api/[controller]")]
[ApiController]
public class MatriculaController : ApiController
{
    [HttpPost]
    [Authorize]
    public async Task<Response<GenerarMatriculaResultDTO>> GenerarMatricula([FromBody] GenerarMatriculaCommand command, CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    [HttpPut("Actualizar")]
    [AllowAnonymous]
    public async Task<Response<bool>> Update([FromBody] UpdateMatriculaCommand request, CancellationToken cancellationToken)
        => await Mediator.Send(request, cancellationToken);

    [HttpPut("DetalleMatricula/{idDetalleMatricula}/Remedial")]
    [AllowAnonymous]
    public async Task<Response<bool>> RegistrarRemedial(int idDetalleMatricula, [FromBody] decimal notaRemedial, CancellationToken cancellationToken)
        => await Mediator.Send(new RegistrarExamenRemedialCommand(idDetalleMatricula, notaRemedial), cancellationToken);

    [HttpGet]
    [AllowAnonymous]
    public async Task<Response<PaginatedResult<MatriculaDTO>>> GetMatriculas([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
        => await Mediator.Send(new GetMatriculasQuery(pageNumber, pageSize), cancellationToken);

    [HttpGet("datos-faltantes-persona")]
    [AllowAnonymous]
     public async Task<Response<IEnumerable<MatriculaFaltantesDTO>>> GetMatriculasDatosFaltantesPersona(CancellationToken cancellationToken)
        => await Mediator.Send(new GetMatriculasDatosFaltantesPersonaQuery(), cancellationToken);

    [AllowAnonymous]
    [HttpGet("{id}/notas")]
    public async Task<Response<BoletinAlumnoDTO>> GetBoletin(int id)
        => await Mediator.Send(new GetBoletinQuery(id));

    [AllowAnonymous]
    [HttpGet("ByMalla/{idMalla}")]
    public async Task<Response<PaginatedResult<MatriculaDTO>>> GetByMalla(int idMalla, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
        => await Mediator.Send(new GetMatriculasByMallaQuery(idMalla, pageNumber, pageSize), cancellationToken);

    [AllowAnonymous]
    [HttpGet("ByParalelo/{idParalelo}")]
    public async Task<Response<IEnumerable<MatriculaDTO>>> GetByParalelo(int idParalelo)
        => await Mediator.Send(new GetMatriculasByParaleloQuery(idParalelo));

    [AllowAnonymous]
    [HttpGet("ByAlumno/{idUsuario}")]
    public async Task<Response<IEnumerable<MatriculaDTO>>> GetByAlumno(int idUsuario)
        => await Mediator.Send(new GetMatriculasByAlumnoQuery(idUsuario));

    [AllowAnonymous]
    [HttpGet("ByAlumno/{idUsuario}/Completo")]
    public async Task<Response<HistorialAcademicoDTO>> GetHistorialCompleto(int idUsuario)
        => await Mediator.Send(new GetHistorialAcademicoQuery(idUsuario));

    [AllowAnonymous]
    [HttpGet("ByParalelo/{idParalelo}/Materia/{idDetalleMalla}")]
    public async Task<Response<IEnumerable<DetalleMatriculaConAlumnoDTO>>> GetByParaleloAndMateria(int idParalelo, int idDetalleMalla)
        => await Mediator.Send(new GetDetallesMatriculaByParaleloYMateriaQuery(idParalelo, idDetalleMalla));
}
