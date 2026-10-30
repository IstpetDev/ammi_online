using AMMI_Online_API.Application.Features.Adjuntos.Commands;
using AMMI_Online_API.Application.Features.Adjuntos.Queries;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Interfaces.Adjuntos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AMMI_Online_API.API.Controllers.Common;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdjuntosController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAdjuntosAuthorizationService _authorizationService;
    private readonly IAdjuntos? _adjuntosRepo;

    public AdjuntosController(
        IMediator mediator,
        IAdjuntosAuthorizationService authorizationService,
        IAdjuntos? adjuntosRepo = null)
    {
        _mediator = mediator;
        _authorizationService = authorizationService;
        _adjuntosRepo = adjuntosRepo;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var idPersonaClaim = User.FindFirst("idPersona")?.Value;
        int.TryParse(idPersonaClaim, out var idPersona);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);

        var autorizado = await _authorizationService.PuedeAccederAdjuntoAsync(id, idPersona, roles, cancellationToken);
        if (!autorizado)
            return Forbid();

        var response = await _mediator.Send(new GetAdjuntoByIdQuery(id), cancellationToken);

        if (!response.IsSuccess)
            return NotFound(response.Message);

        var dto = response.Data;
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Content-Disposition"] = $"attachment; filename=\"{dto.FileName}\"";
        return File(dto.Content, dto.ContentType, dto.FileName);
    }

    [HttpGet("by-path")]
    public async Task<IActionResult> GetByPath([FromQuery] string path, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(path))
            return BadRequest("La ruta del archivo es requerida.");

        if (_adjuntosRepo == null)
            return StatusCode(StatusCodes.Status500InternalServerError, "Repositorio de adjuntos no disponible.");

        var adjunto = await _adjuntosRepo.GetByPathAsync(path, cancellationToken);
        if (adjunto == null)
            return NotFound("Archivo no encontrado en base de datos.");

        var idPersonaClaim = User.FindFirst("idPersona")?.Value;
        int.TryParse(idPersonaClaim, out var idPersona);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);

        var autorizado = await _authorizationService.PuedeAccederAdjuntoAsync(adjunto.IdAdjunto, idPersona, roles, cancellationToken);
        if (!autorizado)
            return Forbid();

        var response = await _mediator.Send(new GetAdjuntoByIdQuery(adjunto.IdAdjunto), cancellationToken);
        if (!response.IsSuccess)
            return NotFound(response.Message);

        var dto = response.Data;
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Content-Disposition"] = $"attachment; filename=\"{dto.FileName}\"";
        return File(dto.Content, dto.ContentType, dto.FileName);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var idPersonaClaim = User.FindFirst("idPersona")?.Value;
        int.TryParse(idPersonaClaim, out var idPersona);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);

        var autorizado = await _authorizationService.PuedeEliminarAdjuntoAsync(id, idPersona, roles, cancellationToken);
        if (!autorizado)
            return Forbid();

        var response = await _mediator.Send(new DeleteAdjuntoCommand(id), cancellationToken);

        if (!response.IsSuccess)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
