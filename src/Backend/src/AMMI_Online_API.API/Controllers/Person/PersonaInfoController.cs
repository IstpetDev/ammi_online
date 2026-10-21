using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person
{
    public class PersonaInfoController : ApiController
    {
        [HttpGet]
        
        public async Task<Response<IEnumerable<PersonaInfoDTO>>> GetByPersonaInfo([FromQuery] GetPersonasInfoQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        
        public async Task<Response<int>> CreatePersonaInfo([FromBody] CreatePersonaInfoCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        
        public async Task<Response<bool>> UpdatePersonaInfo([FromBody] UpdatePersonaInfoCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
        [HttpDelete]
        
        public async Task<Response<bool>> DeletePersonaInfo([FromQuery] DeletePersonaInfoCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
    }
}
