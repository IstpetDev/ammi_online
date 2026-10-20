using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person
{
    public class PersonaAlergiasController : ApiController
    {
        [HttpGet]
        public async Task<Response<IEnumerable<PersonaAlergiasDTO>>> GetByPersonaAlergias([FromQuery] GetByPersonaAlergiasAsync query, CancellationToken cancellationToken)
            =>  await Mediator.Send(query, cancellationToken);
        [HttpPost]
        public async Task<Response<int>> CreatePersonaAlergias([FromBody] CreatePersonaAlergiasCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
        [HttpPut]
        public async Task<Response<bool>> UpdatePersonaAlergias([FromBody] UpdatePersonaAlergiasCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
        [HttpDelete]
        public async Task<Response<bool>> DeletePersonaAlergias([FromQuery] DeletePersonaAlergiasCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
    }
}
