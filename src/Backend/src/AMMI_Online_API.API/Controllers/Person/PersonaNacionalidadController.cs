using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person
{

    public class PersonaNacionalidadController : ApiController
    {
        [HttpGet]
        public async Task<Response<IEnumerable<PersonaNacionalidadDTO>>> GetByPersonaNacionalidad([FromQuery] GetPersonaNacionalidadQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        public async Task<Response<int>> CreatePersonaNacionalidad([FromBody] CreatePersonaNacionalidadCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        public async Task<Response<bool>> UpdatePersonaNacionalidad([FromBody] UpdatePersonaNacionalidadCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
        [HttpDelete]
        public async Task<Response<bool>> DeletePersonaNacionalidad([FromQuery] DeletePersonaNacionalidadCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
    }
}
