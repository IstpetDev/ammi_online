using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person
{
    public class PersonaDiscapacidadController : ApiController
    {
        [HttpGet]
        public async Task<Response<IEnumerable<PersonaDiscapacidadDTO>>> GetByPersonaDiscapacidad([FromQuery] GetByPersonaDiscapacidadAsync query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreatePersonaDiscapacidad([FromForm] CreatePersonaDiscapacidadCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<bool>> UpdatePersonaDiscapacidad([FromForm] UpdatePersonaDiscapacidadCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete]
        public async Task<Response<bool>> DeletePersonaDiscapacidad([FromQuery] DeletePersonaDiscapacidadCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
    }
}
