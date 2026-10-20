using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Postulations
{
    public class CambiarEstadoPostulacionController : ApiController
    {
        [HttpPost]
        [Authorize]
        public async Task<Response<CambiarEstadoResultDTO>> CambiarEstado(
            [FromBody] CambiarEstadoPostulacionCommand command,
            CancellationToken cancellationToken)
        {
            var idPersonaClaim = User.FindFirst("idPersona")?.Value;
            if (string.IsNullOrEmpty(idPersonaClaim) || !int.TryParse(idPersonaClaim, out int idEvaluador))
            {
                return Response<CambiarEstadoResultDTO>.Failure(
                    "Token invalido: no se pudo obtener el id del evaluador");
            }

            var commandConEvaluador = command with
            {
                cambiarestado = command.cambiarestado with { IdEvaluador = idEvaluador }
            };

            return await Mediator.Send(commandConEvaluador, cancellationToken);
        }
    }
}
