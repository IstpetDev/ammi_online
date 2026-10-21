using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AMMI_Online_API.API.Controllers.Segurity;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<LoginResponseDTO>>> Login(
        [FromBody] LoginRequestDTO request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new LoginCommand(request), cancellationToken);

        if (!result.IsSuccess)
            return Unauthorized(result);

        // CONFIGURAR COOKIE HTTPONLY PARA SEGURIDAD
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Debe ser true para HTTPS
            SameSite = SameSiteMode.None, // Permitir cross-site si es necesario
            Expires = result.Data.TokenExpiration,
            Path = "/"
        };

        Response.Cookies.Append("token", result.Data.Token, cookieOptions);

        return Ok(result);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<Response<int>>> Register(
        [FromBody] RegisterRequestDTO request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new RegisterCommand(request), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(Login), result);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<Response<bool>>> ChangePassword(
        [FromBody] ChangePasswordDTO request,
        CancellationToken cancellationToken)
    {
        var idPersona = int.Parse(User.FindFirst("idPersona")?.Value ?? "0");
        var result = await _mediator.Send(new ChangePasswordCommand(idPersona, request), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("cambiar-contrasenia-primer-ingreso")]
    [Authorize]
    public async Task<ActionResult<Response<bool>>> CambiarContraseniaPrimerIngreso(
        [FromBody] CambiarContraseniaFirstLoginDTO request,
        CancellationToken cancellationToken)
    {
        var idPersona = int.Parse(User.FindFirst("idPersona")?.Value ?? "0");
        var result = await _mediator.Send(new CambiarContraseniaFirstLoginCommand(idPersona, request), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<Response<object>> GetCurrentUser()
    {
        var userInfo = new
        {
            IdPersona = User.FindFirst("idPersona")?.Value,
            Username = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("unique_name")?.Value,
            Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value),
            Permisos = User.FindFirst("permisos")?.Value
        };

        return Ok(Response<object>.Success(userInfo, "Usuario autenticado"));
    }

    [HttpPost("forgot-password")]
    
    public async Task<ActionResult<Response<bool>>> ForgotPassword(
        [FromBody] ForgotPasswordRequestDTO request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ForgotPasswordCommand(request), cancellationToken);
        if (!result.IsSuccess) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("reset-password")]
    
    public async Task<ActionResult<Response<bool>>> ResetPassword(
        [FromBody] ResetPasswordRequestDTO request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ResetPasswordCommand(request), cancellationToken);
        if (!result.IsSuccess) return BadRequest(result);
        return Ok(result);
    }
}
