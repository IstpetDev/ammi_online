using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.Features.Payments.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Payments;
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "MASTER-CONTABILIDAD,ADMINISTRADOR,SUPERVISOR")]
public class ContabilidadController : ApiController
{
    [HttpGet("resumen-alumnos")]
    public async Task<Response<IEnumerable<ResumenAlumnoContabilidadDTO>>> GetResumenAlumnos(
        [FromQuery] int idCiclo,
        [FromQuery] int? idCurso,
        [FromQuery] string? documento,
        CancellationToken cancellationToken)
    {
        var query = new GetResumenAlumnosContabilidadQuery
        {
            IdCiclo = idCiclo,
            IdCurso = idCurso,
            Documento = documento
        };
        return await Mediator.Send(query, cancellationToken);
    }
}
