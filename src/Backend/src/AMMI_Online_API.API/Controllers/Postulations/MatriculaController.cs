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
[Authorize]
public class MatriculaController : ApiController
{
    [HttpPost]
    public async Task<Response<GenerarMatriculaResultDTO>> GenerarMatricula([FromBody] GenerarMatriculaCommand command, CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);

    [HttpPut("Actualizar")]
    
    public async Task<Response<bool>> Update([FromBody] UpdateMatriculaCommand request, CancellationToken cancellationToken)
        => await Mediator.Send(request, cancellationToken);

    [HttpPut("DetalleMatricula/{idDetalleMatricula}/Remedial")]
    public async Task<Response<bool>> RegistrarRemedial(int idDetalleMatricula, [FromBody] RegistrarRemedialDTO request, CancellationToken cancellationToken)
        => await Mediator.Send(new RegistrarExamenRemedialCommand(idDetalleMatricula, request.NotaRemedial), cancellationToken);

    [HttpGet]
    
    public async Task<Response<PaginatedResult<MatriculaDTO>>> GetMatriculas([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] int? idCiclo = null, [FromQuery] int? idOfertaAcademica = null, [FromQuery] string? documentoNombre = null, [FromQuery] int? idMalla = null, CancellationToken cancellationToken = default)
        => await Mediator.Send(new GetMatriculasQuery(pageNumber, pageSize, idCiclo, idOfertaAcademica, documentoNombre, idMalla), cancellationToken);

    [HttpGet("datos-faltantes-persona")]
    
     public async Task<Response<IEnumerable<MatriculaFaltantesDTO>>> GetMatriculasDatosFaltantesPersona(CancellationToken cancellationToken)
        => await Mediator.Send(new GetMatriculasDatosFaltantesPersonaQuery(), cancellationToken);

    
    [HttpGet("{id}/notas")]
    public async Task<Response<BoletinAlumnoDTO>> GetBoletin(int id)
        => await Mediator.Send(new GetBoletinQuery(id));

    
    [HttpGet("ByMalla/{idMalla}")]
    public async Task<Response<PaginatedResult<MatriculaDTO>>> GetByMalla(int idMalla, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
        => await Mediator.Send(new GetMatriculasByMallaQuery(idMalla, pageNumber, pageSize), cancellationToken);

    
    [HttpGet("ByMallaParalelo/{idMallaParalelo}")]
    public async Task<Response<IEnumerable<MatriculaDTO>>> GetByMallaParalelo(int idMallaParalelo)
        => await Mediator.Send(new GetMatriculasByMallaParaleloQuery(idMallaParalelo));

    
    [HttpGet("ByAlumno/{idUsuario}")]
    public async Task<Response<IEnumerable<MatriculaDTO>>> GetByAlumno(int idUsuario)
        => await Mediator.Send(new GetMatriculasByAlumnoQuery(idUsuario));

    
    [HttpPut("{id}/Estado")]
    [Authorize(Roles = "ADMINISTRADOR,SUPERVISOR")]
    public async Task<Response<bool>> CambiarEstado(int id, [FromBody] int idEstadoMatricula)
        => await Mediator.Send(new CambiarEstadoMatriculaCommand(id, idEstadoMatricula));

    
    [HttpGet("ByAlumno/{idUsuario}/Completo")]
    public async Task<Response<HistorialAcademicoDTO>> GetHistorialCompleto(int idUsuario)
        => await Mediator.Send(new GetHistorialAcademicoQuery(idUsuario));

    
    [HttpGet("ByMallaParalelo/{idMallaParalelo}/Materia/{idDetalleMalla}")]
    public async Task<Response<IEnumerable<DetalleMatriculaConAlumnoDTO>>> GetByMallaParaleloAndMateria(int idMallaParalelo, int idDetalleMalla)
        => await Mediator.Send(new GetDetallesMatriculaByMallaParaleloYMateriaQuery(idMallaParalelo, idDetalleMalla));

    [AllowAnonymous]
    [HttpPut("{id}/CambiarParalelo")]
    public async Task<Response<CambiarParaleloResultDTO>> CambiarParalelo(int id, [FromBody] int idMallaParaleloNuevo, CancellationToken cancellationToken)
        => await Mediator.Send(new CambiarParaleloMatriculaCommand(id, idMallaParaleloNuevo), cancellationToken);
}
