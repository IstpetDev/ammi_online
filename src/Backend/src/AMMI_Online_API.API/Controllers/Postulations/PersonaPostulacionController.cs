using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Postulations
{
    public class PersonaPostulacion : ApiController
    {
        [HttpGet]
        public async Task<Response<PaginatedResult<PersonaPostulacionDTO>>> GetPostulacionBy([FromQuery] GetPersonaPostulacionQuery query , CancellationToken cancellationToken)
        {
            var isSecretaria = User.IsInRole("SECRETARIA-GENERAL") || User.IsInRole("SECRETARIA");
            if (isSecretaria)
            {
                query.ExcludeContactoPersona = true;
            }
            return await Mediator.Send(query, cancellationToken);
        }

        [HttpPost("create-postulacion")]
        [AllowAnonymous]
        public async Task<Response<int>> CrearPostulacion([FromBody] CreatePersonaPostulacionCommand request, CancellationToken cancellationToken)
            => await Mediator.Send(request, cancellationToken);

        [HttpPost("postulacion")]
        [AllowAnonymous]
        public async Task<Response<int>> CrearPostulacionManual([FromForm] CreatePersonaPostulacionManualCommand request, CancellationToken cancellationToken)
            => await Mediator.Send(request, cancellationToken);

        [HttpPut("actualizar-postulacion-contacto")]
        [AllowAnonymous]
        public async Task<Response<int>> ActualizarPostulacionContacto([FromForm] ActualizarPostulacionContactoCommand request, CancellationToken cancellationToken)
            => await Mediator.Send(request, cancellationToken);
    }
}
