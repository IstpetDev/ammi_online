using AMMI_Online_API.API.Extensions;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AMMI_Online_API.API.Controllers.Segurity;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
[EnableRateLimiting(RateLimiterExtensions.OtpPolicy)]
public class EmailVerificationController : ControllerBase
{
    private readonly IMediator _mediator;

    public EmailVerificationController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("send-otp")]
    public async Task<ActionResult<Response<OtpResponseDTO>>> SendOtp(
        [FromBody] SendOtpRequestDTO request,
        CancellationToken cancellationToken)
    {
        var command = new SendOtpCommand(request.Email, request.NombrePostulante);
        var result = await _mediator.Send(command, cancellationToken);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpGet("verify-email-token")]
    public async Task<ActionResult<Response<VerifyOtpResponseDTO>>> VerifyEmailToken(
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(Response<VerifyOtpResponseDTO>.Failure("El token es requerido"));

        var command = new VerifyOtpByTokenCommand(token);
        var result = await _mediator.Send(command, cancellationToken);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("verify-otp")]
    public async Task<ActionResult<Response<VerifyOtpResponseDTO>>> VerifyOtp(
        [FromBody] VerifyOtpRequestDTO request,
        CancellationToken cancellationToken)
    {
        var command = new VerifyOtpCommand(request.Email, request.Codigo);
        var result = await _mediator.Send(command, cancellationToken);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("resend-otp")]
    public async Task<ActionResult<Response<OtpResponseDTO>>> ResendOtp(
        [FromQuery] string email,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(Response<OtpResponseDTO>.Failure("El email es requerido"));

        var command = new ResendOtpCommand(email);
        var result = await _mediator.Send(command, cancellationToken);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpGet("is-verified")]
    public async Task<ActionResult<Response<bool>>> CheckEmailVerified(
        [FromQuery] string email,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(Response<bool>.Failure("El email es requerido"));

        var query = new CheckEmailVerifiedQuery(email);
        var result = await _mediator.Send(query, cancellationToken);
        
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
