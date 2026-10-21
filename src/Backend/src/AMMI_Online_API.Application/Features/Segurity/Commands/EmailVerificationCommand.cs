using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Segurity.Commands;

/// <summary>
/// Command para enviar un código OTP al email del postulante
/// </summary>
public record SendOtpCommand(
    string Email,
    string? NombrePostulante = null
) : IRequest<Response<OtpResponseDTO>>;

/// <summary>
/// Command para verificar un código OTP ingresado (fallback manual)
/// </summary>
public record VerifyOtpCommand(
    string Email,
    string Codigo
) : IRequest<Response<VerifyOtpResponseDTO>>;

/// <summary>
/// Command para verificar por token desde email (click en botón)
/// </summary>
public record VerifyOtpByTokenCommand(
    string Token
) : IRequest<Response<VerifyOtpResponseDTO>>;

/// <summary>
/// Command para reenviar un código OTP
/// </summary>
public record ResendOtpCommand(
    string Email
) : IRequest<Response<OtpResponseDTO>>;
