using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person
{
    public class PersonaActividadEconomicaController : ApiController
    {
        [HttpGet]
        public async Task<Response<IEnumerable<PersonaActividadEconomicaDTO>>> GetByPersonaActividadEconomica([FromQuery] GetByPersonaActividadEconomicaAsync query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);
        [HttpPost]
        public async Task<Response<int>> CreatePersonaActividadEconomica([FromBody] CreatePersonaActividadEconomicaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
        [HttpPut]
        public async Task<Response<bool>> UpdatePersonaActividadEconomica([FromBody] UpdatePersonaActividadEconomicaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete]
        public async Task<Response<bool>> DeletePersonaActividadEconomica([FromQuery] DeletePersonaActividadEconomicaCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
    }
}
