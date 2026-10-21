using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person
{
    public class PersonaDireccionController : ApiController
    {
        [HttpGet]
        
        public async Task<Response<IEnumerable<PersonaDireccionDTO>>> GetByPersonaDireccion([FromQuery] GetByPersonaDireccionAsync query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);
        [HttpPost]
        
        public async Task<Response<int>> CreatePersonaDireccion([FromBody] CreatePersonaDireccionCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
        [HttpPut]
        
        public async Task<Response<bool>> UpdatePersonaDireccion([FromBody] UpdatePersonaDireccionCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete]
        
        public async Task<Response<bool>> DeletePersonaDireccion([FromQuery] DeletePersonaDireccionCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
    }
}
