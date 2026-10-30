namespace AMMI_Online_API.Application.Common.Security;

/// <summary>
/// Opciones de configuración de seguridad para autenticación, tasa de intentos y bloqueo temporal.
/// </summary>
public class AuthSecurityOptions
{
    public const string SectionName = "AuthSecurity";

    /// <summary>
    /// Número máximo de intentos fallidos antes de bloquear temporalmente (por defecto: 5).
    /// </summary>
    public int MaxFailedAttempts { get; set; } = 5;

    /// <summary>
    /// Duración del bloqueo temporal en minutos (por defecto: 15 minutos).
    /// </summary>
    public int LockoutDurationMinutes { get; set; } = 15;

    /// <summary>
    /// Ventana de tiempo en minutos en la cual se acumulan los fallos (por defecto: 15 minutos).
    /// </summary>
    public int FailedAttemptWindowMinutes { get; set; } = 15;

    /// <summary>
    /// Máximo de solicitudes de acciones sensibles (OTP, recuperación de contraseña) en la ventana (por defecto: 5).
    /// </summary>
    public int MaxActionAttempts { get; set; } = 5;

    /// <summary>
    /// Ventana de tiempo para acciones sensibles en minutos (por defecto: 15 minutos).
    /// </summary>
    public int ActionWindowMinutes { get; set; } = 15;
}
