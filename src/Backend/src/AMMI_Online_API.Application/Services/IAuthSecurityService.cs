namespace AMMI_Online_API.Application.Services;

/// <summary>
/// Servicio para control de tasa de intentos sensibles, mitigación de fuerza bruta,
/// bloqueo temporal por IP y cuenta, y generación de respuestas neutras contra enumeración de usuarios.
/// </summary>
public interface IAuthSecurityService
{
    /// <summary>
    /// Obtiene la dirección IP real del cliente actual (desde HttpContext, respetando proxies de confianza).
    /// </summary>
    string GetCurrentClientIp();

    /// <summary>
    /// Determina si el inicio de sesión se encuentra bloqueado temporalmente para la cuenta o la IP indicada.
    /// </summary>
    bool IsLoginLockedOut(string accountIdentifier, string? clientIp = null);

    /// <summary>
    /// Determina si una dirección IP específica se encuentra bloqueada temporalmente.
    /// </summary>
    bool IsIpLockedOut(string ipAddress);

    /// <summary>
    /// Determina si una cuenta o identificador de usuario se encuentra bloqueado temporalmente.
    /// </summary>
    bool IsAccountLockedOut(string accountIdentifier);

    /// <summary>
    /// Determina si una acción sensible (ej. forgot-password, send-otp) está bloqueada temporalmente.
    /// </summary>
    bool IsActionLockedOut(string actionKey, string accountIdentifier, string? clientIp = null);

    /// <summary>
    /// Registra un intento fallido para la cuenta y/o la IP. Retorna true si este intento desencadenó el bloqueo.
    /// </summary>
    bool RecordFailedAttempt(string accountIdentifier, string? clientIp = null);

    /// <summary>
    /// Registra una solicitud de acción sensible. Retorna true si se superó el límite permitido en la ventana.
    /// </summary>
    bool RecordActionAttempt(string actionKey, string accountIdentifier, string? clientIp = null);

    /// <summary>
    /// Restablece el contador de intentos y remueve el bloqueo temporal para la cuenta y la IP indicada.
    /// </summary>
    void ResetFailedAttempts(string accountIdentifier, string? clientIp = null);

    /// <summary>
    /// Mensaje neutro de credenciales inválidas para impedir la enumeración de usuarios en el sistema.
    /// </summary>
    string GetInvalidCredentialsMessage();

    /// <summary>
    /// Mensaje neutro de bloqueo temporal que no revela la existencia o estado de la cuenta.
    /// </summary>
    string GetLockoutMessage();
}
