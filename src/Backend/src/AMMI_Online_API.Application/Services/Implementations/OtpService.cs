using System.Net.Http.Headers;
using System.Security.Cryptography;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AMMI_Online_API.Application.Services.Implementations;

public class OtpService : IOtpService
{
    private readonly IEmailVerificationOtpRepository _otpRepository;
    private readonly IEmailService _emailService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuthSecurityService _authSecurityService;
    private readonly ILogger<OtpService> _logger;
    private readonly string _frontendUrl;

    private const int OTP_EXPIRATION_MINUTES = 10;
    private const int MAX_DAILY_ATTEMPTS = 5;
    private const int RESEND_COOLDOWN_SECONDS = 60;

    public OtpService(
        IEmailVerificationOtpRepository otpRepository,
        IEmailService emailService,
        IPasswordHasher passwordHasher,
        IAuthSecurityService authSecurityService,
        ILogger<OtpService> logger,
        IConfiguration configuration)
    {
        _otpRepository = otpRepository;
        _emailService = emailService;
        _passwordHasher = passwordHasher;
        _authSecurityService = authSecurityService;
        _logger = logger;
        _frontendUrl = configuration["FrontendSettings:BaseUrl"] ?? "http://localhost:4200";
    }

    public async Task<string> GenerateOtpCodeAsync()
    {
        // Generar código de 6 dígitos usando criptografía segura
        var bytes = new byte[4];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }

        var number = BitConverter.ToUInt32(bytes, 0) % 900000 + 100000;
        return number.ToString();
    }

    public async Task<Response<OtpResponseDTO>> SendOtpEmailAsync(string email, string? nombrePostulante = null)
    {
        try
        {
            var clientIp = _authSecurityService.GetCurrentClientIp();
            var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();

            // 1. Control de tasa de solicitudes por IP y por correo
            if (_authSecurityService.IsActionLockedOut("send-otp", normalizedEmail, clientIp))
            {
                _logger.LogWarning(
                    "Solicitud de OTP rechazada por exceso de tasa para '{Email}' desde la IP '{IpAddress}'.",
                    normalizedEmail,
                    clientIp);
                return Response<OtpResponseDTO>.Failure(
                    "Demasiadas solicitudes de código de verificación. Por favor, intente más tarde.");
            }

            // 2. Verificar límite diario por correo
            var dailyAttempts = await _otpRepository.GetDailyAttemptsCountAsync(normalizedEmail);
            if (dailyAttempts >= MAX_DAILY_ATTEMPTS)
            {
                _logger.LogWarning(
                    "Límite diario de OTP excedido ({MaxAttempts}) para '{Email}' desde la IP '{IpAddress}'.",
                    MAX_DAILY_ATTEMPTS,
                    normalizedEmail,
                    clientIp);
                return Response<OtpResponseDTO>.Failure(
                    $"Has excedido el límite de {MAX_DAILY_ATTEMPTS} intentos diarios. Por favor, intenta mañana.");
            }

            // 3. Verificar si existe un OTP activo reciente (cooldown)
            var existingOtp = await _otpRepository.GetActiveOtpAsync(normalizedEmail);
            if (existingOtp != null && existingOtp.UltimoReenvio.HasValue)
            {
                var timeSinceLastResend = (DateTime.UtcNow - existingOtp.UltimoReenvio.Value).TotalSeconds;
                if (timeSinceLastResend < RESEND_COOLDOWN_SECONDS)
                {
                    var waitTime = RESEND_COOLDOWN_SECONDS - (int)timeSinceLastResend;
                    return Response<OtpResponseDTO>.Failure(
                        $"Debes esperar {waitTime} segundos antes de solicitar un nuevo código.");
                }
            }

            _authSecurityService.RecordActionAttempt("send-otp", normalizedEmail, clientIp);

            // 4. Revocar OTPs activos anteriores
            await _otpRepository.RevokeActiveOtpsAsync(normalizedEmail);

            // 5. Generar nuevo código OTP
            var codigoPlano = await GenerateOtpCodeAsync();

            // 6. Hashear el código para almacenamiento seguro
            var codigoHasheado = _passwordHasher.HashPassword(codigoPlano);
            var fechaExpiracion = DateTime.UtcNow.AddMinutes(OTP_EXPIRATION_MINUTES);

            // 7. Guardar en base de datos
            var otp = new EmailVerificacionesOtp
            {
                Email = normalizedEmail,
                CodigoOtp = codigoHasheado,
                FechaCreacion = DateTime.UtcNow,
                FechaExpiracion = fechaExpiracion,
                IntentosRestantes = 3,
                EsVerificado = 0ul,
                ReenviosRealizados = existingOtp?.ReenviosRealizados + 1 ?? 0,
                UltimoReenvio = DateTime.UtcNow,
                IpOrigen = clientIp
            };

            await _otpRepository.CreateOtpAsync(otp);

            // 8. Generar token de verificación para URL
            var verificationToken = Convert.ToBase64String(
                System.Text.Encoding.UTF8.GetBytes($"{normalizedEmail}:{codigoPlano}:{otp.IdVerificacion}")
            );

            // 9. Enviar email (NO se registra el código OTP ni el token en los logs)
            var emailBody = GenerateOtpEmailTemplate(verificationToken, nombrePostulante ?? "Postulante");
            var emailSent = await _emailService.SendEmailAsync(
                normalizedEmail,
                "Verificación de Correo Electrónico - AMMI Online",
                emailBody,
                true
            );

            if (!emailSent)
            {
                _logger.LogWarning(
                    "Fallo al enviar correo de verificación OTP a '{Email}' desde la IP '{IpAddress}'.",
                    normalizedEmail,
                    clientIp);
                return Response<OtpResponseDTO>.Failure(
                    "Error al enviar el código de verificación. Por favor, verifica tu email e intenta nuevamente.");
            }

            _logger.LogInformation(
                "Email de verificación OTP despachado para '{Email}' desde la IP '{IpAddress}'.",
                normalizedEmail,
                clientIp);

            var response = new OtpResponseDTO
            {
                Enviado = true,
                Mensaje = "Email de verificación enviado. Revisa tu bandeja de entrada y haz clic en el botón de verificación.",
                FechaExpiracion = fechaExpiracion,
                IntentosRestantes = 3
            };

            return Response<OtpResponseDTO>.Success(response, "Email de verificación enviado correctamente");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al enviar el código OTP a '{Email}'.", email);
            return Response<OtpResponseDTO>.Failure($"Error inesperado al enviar el código: {ex.Message}");
        }
    }

    public async Task<Response<VerifyOtpResponseDTO>> VerifyOtpAsync(string email, string codigo)
    {
        try
        {
            var clientIp = _authSecurityService.GetCurrentClientIp();
            var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();

            // 1. Verificar bloqueo temporal por IP o cuenta
            if (_authSecurityService.IsLoginLockedOut(normalizedEmail, clientIp))
            {
                _logger.LogWarning(
                    "Verificación de OTP rechazada por bloqueo temporal para '{Email}' desde la IP '{IpAddress}'.",
                    normalizedEmail,
                    clientIp);
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Demasiados intentos fallidos. Su acceso ha sido bloqueado temporalmente por motivos de seguridad.");
            }

            // 2. Obtener OTP activo
            var otp = await _otpRepository.GetActiveOtpAsync(normalizedEmail);

            if (otp == null)
            {
                _authSecurityService.RecordFailedAttempt(normalizedEmail, clientIp);
                _logger.LogWarning(
                    "Fallo en verificación de OTP para '{Email}' desde la IP '{IpAddress}'. No existe OTP pendiente.",
                    normalizedEmail,
                    clientIp);
                return Response<VerifyOtpResponseDTO>.Failure(
                    "No hay una verificación pendiente para este email. Solicita un nuevo email de verificación.");
            }

            // 3. Verificar expiración
            if (otp.FechaExpiracion < DateTime.UtcNow)
            {
                _authSecurityService.RecordFailedAttempt(normalizedEmail, clientIp);
                _logger.LogWarning(
                    "Fallo en verificación de OTP para '{Email}' desde la IP '{IpAddress}'. Token expirado.",
                    normalizedEmail,
                    clientIp);
                return Response<VerifyOtpResponseDTO>.Failure(
                    "El enlace de verificación ha expirado. Por favor, solicita un nuevo email.");
            }

            // 4. Verificar intentos restantes
            if (otp.IntentosRestantes <= 0)
            {
                _authSecurityService.RecordFailedAttempt(normalizedEmail, clientIp);
                _logger.LogWarning(
                    "Fallo en verificación de OTP para '{Email}' desde la IP '{IpAddress}'. Intentos agotados.",
                    normalizedEmail,
                    clientIp);
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Has agotado los intentos. Solicita un nuevo email de verificación.");
            }

            // 5. Verificar el código usando BCrypt (sin registrar el código ingresado)
            var isValidCode = _passwordHasher.VerifyPassword(codigo, otp.CodigoOtp);

            if (!isValidCode)
            {
                await _otpRepository.DecrementIntentosAsync(otp.IdVerificacion);
                _authSecurityService.RecordFailedAttempt(normalizedEmail, clientIp);

                _logger.LogWarning(
                    "Fallo en verificación de OTP para '{Email}' desde la IP '{IpAddress}'. Código incorrecto.",
                    normalizedEmail,
                    clientIp);

                var intentosRestantes = otp.IntentosRestantes - 1;
                return Response<VerifyOtpResponseDTO>.Failure(
                    $"Token de verificación inválido. Te quedan {intentosRestantes} intento{(intentosRestantes == 1 ? "" : "s")}.");
            }

            // 6. Código correcto - marcar como verificado e invalidar el token/OTP para un solo uso
            var verified = await _otpRepository.VerifyOtpAsync(normalizedEmail, otp.CodigoOtp);

            if (!verified)
            {
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Error al verificar el email. Intenta nuevamente.");
            }

            // 7. Restablecer intentos fallidos
            _authSecurityService.ResetFailedAttempts(normalizedEmail, clientIp);
            _logger.LogInformation(
                "Email '{Email}' verificado exitosamente desde la IP '{IpAddress}'.",
                normalizedEmail,
                clientIp);

            var response = new VerifyOtpResponseDTO
            {
                Verificado = true,
                Mensaje = "¡Email verificado exitosamente! Puedes continuar con tu postulación."
            };

            return Response<VerifyOtpResponseDTO>.Success(response, "Verificación exitosa");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al verificar OTP para '{Email}'.", email);
            return Response<VerifyOtpResponseDTO>.Failure($"Error inesperado al verificar: {ex.Message}");
        }
    }

    public async Task<Response<VerifyOtpResponseDTO>> VerifyOtpByTokenAsync(string token)
    {
        try
        {
            var clientIp = _authSecurityService.GetCurrentClientIp();

            // 1. Decodificar el token desde Base64
            string decodedToken;
            try
            {
                var tokenBytes = Convert.FromBase64String(token);
                decodedToken = System.Text.Encoding.UTF8.GetString(tokenBytes);
            }
            catch
            {
                _authSecurityService.RecordFailedAttempt("otp-token-invalido", clientIp);
                _logger.LogWarning(
                    "Intento de verificación por token con formato corrupto desde la IP '{IpAddress}'.",
                    clientIp);
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Token de verificación inválido o corrupto.");
            }

            // 2. Parsear el token (formato: email:codigo:idVerificacion)
            var tokenParts = decodedToken.Split(':');
            if (tokenParts.Length != 3)
            {
                _authSecurityService.RecordFailedAttempt("otp-token-invalido", clientIp);
                _logger.LogWarning(
                    "Intento de verificación por token con estructura no válida desde la IP '{IpAddress}'.",
                    clientIp);
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Token de verificación con formato inválido.");
            }

            var email = tokenParts[0];
            var codigoPlano = tokenParts[1];

            if (!int.TryParse(tokenParts[2], out int _))
            {
                _authSecurityService.RecordFailedAttempt("otp-token-invalido", clientIp);
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Token de verificación inválido.");
            }

            // 3. Delegar al método seguro de verificación con hash
            return await VerifyOtpAsync(email, codigoPlano);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al procesar token de verificación.");
            return Response<VerifyOtpResponseDTO>.Failure(
                $"Error al procesar el token de verificación: {ex.Message}");
        }
    }

    public async Task<Response<OtpResponseDTO>> ResendOtpAsync(string email)
    {
        return await SendOtpEmailAsync(email);
    }

    public async Task<bool> IsEmailRecentlyVerifiedAsync(string email)
    {
        return await _otpRepository.IsEmailVerifiedAsync(email);
    }

    private string GenerateOtpEmailTemplate(string verificationToken, string nombrePostulante)
    {
        var verificationUrl = $"{_frontendUrl}/verify-email-token?token={Uri.EscapeDataString(verificationToken)}";

        return $@"
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Verificación de Email - AMMI Online</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }}
        .container {{
            max-width: 600px;
            margin: 30px auto;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .header p {{
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }}
        .message {{
            color: #666;
            margin-bottom: 30px;
            font-size: 15px;
        }}
        .button-container {{
            text-align: center;
            margin: 40px 0;
        }}
        .verify-button {{
            display: inline-block;
            background: linear-gradient(135deg, #1a237e 0%, #3f51b5 100%);
            color: white !important;
            text-decoration: none;
            padding: 18px 50px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(26, 35, 126, 0.4);
            transition: all 0.3s ease;
        }}
        .warning-box {{
            background-color: #fff3e0;
            border-left: 5px solid #ff9800;
            padding: 20px;
            margin: 25px 0;
            border-radius: 6px;
        }}
        .warning-box p {{
            margin: 0;
            color: #e65100;
            font-weight: 600;
            font-size: 14px;
        }}
        .footer {{
            background-color: #fafafa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }}
        .footer p {{
            margin: 5px 0;
            font-size: 13px;
            color: #757575;
        }}
        .footer .copyright {{
            font-weight: 600;
            color: #424242;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>✉️ Verificación de Correo Electrónico</h1>
            <p>AMMI Online - Sistema de Postulaciones</p>
        </div>
        
        <div class='content'>
            <div class='greeting'>
                Hola <strong>{nombrePostulante}</strong>,
            </div>
            
            <div class='message'>
                <p>Has iniciado el proceso de postulación en <strong>AMMI Online</strong>.</p>
                <p>Para verificar tu correo electrónico, haz clic en el siguiente enlace:</p>
            </div>
            
            <div class='button-container'>
                <a href='{verificationUrl}' class='verify-button' style='color: white !important;'>
                    🔐 Verificar mi Email
                </a>
            </div>
            
            <div class='warning-box'>
                <p>⚠️ Este enlace expirará en <strong>{OTP_EXPIRATION_MINUTES} minutos</strong>.</p>
            </div>
        </div>

        <div class='footer'>
            <p>Este es un correo automático institucional.</p>
            <p class='copyright'>© 2026 AMMI Online. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>";
    }
}
