using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Person.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Person;

public class DocenteController : ApiController
{
    [HttpPost]
    [Authorize]
    public async Task<Response<int>> CreateDocente(
        [FromBody] CreateDocenteCommand command,
        CancellationToken cancellationToken)
        => await Mediator.Send(command, cancellationToken);
}
