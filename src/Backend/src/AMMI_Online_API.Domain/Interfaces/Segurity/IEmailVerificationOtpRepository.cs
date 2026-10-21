using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Segurity;

public interface IEmailVerificationOtpRepository
{
    /// <summary>
    /// Obtiene el OTP activo más reciente para un email
    /// </summary>
    Task<EmailVerificacionesOtp?> GetActiveOtpAsync(string email);

    /// <summary>
    /// Crea un nuevo registro de OTP
    /// </summary>
    Task<EmailVerificacionesOtp> CreateOtpAsync(EmailVerificacionesOtp otp);

    /// <summary>
    /// Verifica y marca como usado un código OTP
    /// </summary>
    Task<bool> VerifyOtpAsync(string email, string codigo);

    /// <summary>
    /// Decrementa el número de intentos restantes
    /// </summary>
    Task<bool> DecrementIntentosAsync(int idVerificacion);

    /// <summary>
    /// Obtiene el número de intentos de OTP realizados en las últimas 24 horas
    /// </summary>
    Task<int> GetDailyAttemptsCountAsync(string email);

    /// <summary>
    /// Invalida todos los OTPs activos de un email
    /// </summary>
    Task RevokeActiveOtpsAsync(string email);

    /// <summary>
    /// Verifica si un email ha sido verificado alguna vez
    /// </summary>
    Task<bool> IsEmailVerifiedAsync(string email);
}
