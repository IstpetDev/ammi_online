using AMMI_Online_API.Application.Features.Adjuntos.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Common;

[ApiController]
[Route("api/[controller]")]
public class AdjuntosController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdjuntosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    [AllowAnonymous] // Or check permissions as needed
    public async Task<IActionResult> GetById(int id)
    {
        var response = await _mediator.Send(new GetAdjuntoByIdQuery(id));

        if (!response.IsSuccess)
            return NotFound(response.Message);

        var dto = response.Data;
        return File(dto.Content, dto.ContentType, dto.FileName);
    }
}
