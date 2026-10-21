using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;

namespace AMMI_Online_API.Application.Services;

/// <summary>
/// Servicio para gestión de códigos OTP de verificación de email
/// </summary>
public interface IOtpService
{
    /// <summary>
    /// Genera un código OTP de 6 dígitos
    /// </summary>
    Task<string> GenerateOtpCodeAsync();

    /// <summary>
    /// Envía un código OTP al email especificado
    /// </summary>
    Task<Response<OtpResponseDTO>> SendOtpEmailAsync(string email, string? nombrePostulante = null);

    /// <summary>
    /// Verifica un código OTP ingresado por el usuario (usado si el usuario ingresa código manualmente)
    /// </summary>
    Task<Response<VerifyOtpResponseDTO>> VerifyOtpAsync(string email, string codigo);

    /// <summary>
    /// Verifica un token de verificación desde el email (click en botón)
    /// </summary>
    Task<Response<VerifyOtpResponseDTO>> VerifyOtpByTokenAsync(string token);

    /// <summary>
    /// Reenvía un código OTP al mismo email
    /// </summary>
    Task<Response<OtpResponseDTO>> ResendOtpAsync(string email);

    /// <summary>
    /// Verifica si un email ha sido verificado recientemente
    /// </summary>
    Task<bool> IsEmailRecentlyVerifiedAsync(string email);
}
