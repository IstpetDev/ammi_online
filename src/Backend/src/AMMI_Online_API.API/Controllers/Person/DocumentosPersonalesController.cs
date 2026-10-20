using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Features.Person.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person
{
    public class DocumentosPersonalesController : ApiController
    {
        [HttpGet]
        public async Task<Response<IEnumerable<DocumentosPersonalesDTO>>> GetByDocumentosPersonales([FromQuery] GetByDocumentosPersonalesQuery query, CancellationToken cancellationToken)
            => await Mediator.Send(query, cancellationToken);

        [HttpPost]
        [AllowAnonymous]
        public async Task<Response<int>> CreateDocumentosPersonales([FromForm] CreateDocumentosPersonalesCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpPut]
        [AllowAnonymous]
        public async Task<Response<bool>> UpdateDocumentosPersonales([FromForm] UpdateDocumentosPersonalesCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);

        [HttpDelete]
        public async Task<Response<bool>> DeleteDocumentosPersonales([FromQuery] DeleteDocumentosPersonalesCommand command, CancellationToken cancellationToken)
            => await Mediator.Send(command, cancellationToken);
    }
}
