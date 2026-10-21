using System.Net.Http.Headers;
using System.Security.Cryptography;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;

namespace AMMI_Online_API.Application.Services.Implementations;

public class OtpService : IOtpService
{
    private readonly IEmailVerificationOtpRepository _otpRepository;
    private readonly IEmailService _emailService;
    private readonly IPasswordHasher _passwordHasher;
    
    private const int OTP_EXPIRATION_MINUTES = 10;
    private const int MAX_DAILY_ATTEMPTS = 5;
    private const int RESEND_COOLDOWN_SECONDS = 60;

    public OtpService(
        IEmailVerificationOtpRepository otpRepository,
        IEmailService emailService,
        IPasswordHasher passwordHasher)
    {
        _otpRepository = otpRepository;
        _emailService = emailService;
        _passwordHasher = passwordHasher;
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
            // 1. Verificar límite diario
            var dailyAttempts = await _otpRepository.GetDailyAttemptsCountAsync(email);
            if (dailyAttempts >= MAX_DAILY_ATTEMPTS)
            {
                return Response<OtpResponseDTO>.Failure(
                    $"Has excedido el límite de {MAX_DAILY_ATTEMPTS} intentos diarios. Por favor, intenta mañana.");
            }

            // 2. Verificar si existe un OTP activo reciente (cooldown)
            var existingOtp = await _otpRepository.GetActiveOtpAsync(email);
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

            // 3. Revocar OTPs activos anteriores
            await _otpRepository.RevokeActiveOtpsAsync(email);

            // 4. Generar nuevo código OTP (sin hashear para enviarlo por email)
            var codigoPlano = await GenerateOtpCodeAsync();
            
            // 5. Hashear el código para almacenarlo de forma segura
            var codigoHasheado = _passwordHasher.HashPassword(codigoPlano);
            
            var fechaExpiracion = DateTime.UtcNow.AddMinutes(OTP_EXPIRATION_MINUTES);

            // 6. Crear registro en base de datos con código hasheado
            var otp = new EmailVerificacionesOtp
            {
                Email = email,
                CodigoOtp = codigoHasheado, // ⚠️ Guardamos el hash, no el código plano
                FechaCreacion = DateTime.UtcNow,
                FechaExpiracion = fechaExpiracion,
                IntentosRestantes = 3,
                EsVerificado = 0ul,
                ReenviosRealizados = existingOtp?.ReenviosRealizados + 1 ?? 0,
                UltimoReenvio = DateTime.UtcNow
            };

            await _otpRepository.CreateOtpAsync(otp);

            // 7. Generar token de verificación (código plano codificado en Base64 para URL)
            var verificationToken = Convert.ToBase64String(
                System.Text.Encoding.UTF8.GetBytes($"{email}:{codigoPlano}:{otp.IdVerificacion}")
            );

            // 8. Enviar email con botón de verificación (no se muestra el código)
            var emailBody = GenerateOtpEmailTemplate(verificationToken, nombrePostulante ?? "Postulante");
            var emailSent = await _emailService.SendEmailAsync(
                email,
                "Verificación de Correo Electrónico - AMMI Online",
                emailBody,
                true
            );

            if (!emailSent)
            {
                return Response<OtpResponseDTO>.Failure(
                    "Error al enviar el código de verificación. Por favor, verifica tu email e intenta nuevamente.");
            }

            // 9. Retornar respuesta exitosa
            var response = new OtpResponseDTO
            {
                Enviado = true,
                Mensaje = "Email de verificación enviado. Revisa tu bandeja de entrada y haz clic en el botón de verificación.",
                FechaExpiracion = fechaExpiracion,
                IntentosRestantes = 3
            };

            return Response<OtpResponseDTO>.Success(
                response, 
                "Email de verificación enviado correctamente");
        }
        catch (Exception ex)
        {
            return Response<OtpResponseDTO>.Failure(
                $"Error inesperado al enviar el código: {ex.Message}");
        }
    }

    public async Task<Response<VerifyOtpResponseDTO>> VerifyOtpAsync(string email, string codigo)
    {
        try
        {
            // 1. Obtener OTP activo
            var otp = await _otpRepository.GetActiveOtpAsync(email);

            if (otp == null)
            {
                return Response<VerifyOtpResponseDTO>.Failure(
                    "No hay una verificación pendiente para este email. Solicita un nuevo email de verificación.");
            }

            // 2. Verificar expiración
            if (otp.FechaExpiracion < DateTime.UtcNow)
            {
                return Response<VerifyOtpResponseDTO>.Failure(
                    "El enlace de verificación ha expirado. Por favor, solicita un nuevo email.");
            }

            // 3. Verificar intentos restantes
            if (otp.IntentosRestantes <= 0)
            {
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Has agotado los intentos. Solicita un nuevo email de verificación.");
            }

            // 4. Verificar el código usando BCrypt (compara con hash almacenado)
            var isValidCode = _passwordHasher.VerifyPassword(codigo, otp.CodigoOtp);
            
            if (!isValidCode)
            {
                // Decrementar intentos
                await _otpRepository.DecrementIntentosAsync(otp.IdVerificacion);
                
                var intentosRestantes = otp.IntentosRestantes - 1;
                return Response<VerifyOtpResponseDTO>.Failure(
                    $"Token de verificación inválido. Te quedan {intentosRestantes} intento{(intentosRestantes == 1 ? "" : "s")}.");
            }

            // 5. Código correcto - marcar como verificado
            var verified = await _otpRepository.VerifyOtpAsync(email, otp.CodigoOtp);

            if (!verified)
            {
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Error al verificar el email. Intenta nuevamente.");
            }

            // 6. Retornar respuesta exitosa
            var response = new VerifyOtpResponseDTO
            {
                Verificado = true,
                Mensaje = "¡Email verificado exitosamente! Puedes continuar con tu postulación."
            };

            return Response<VerifyOtpResponseDTO>.Success(
                response, 
                "Verificación exitosa");
        }
        catch (Exception ex)
        {
            return Response<VerifyOtpResponseDTO>.Failure(
                $"Error inesperado al verificar: {ex.Message}");
        }
    }

    public async Task<Response<VerifyOtpResponseDTO>> VerifyOtpByTokenAsync(string token)
    {
        try
        {
            // 1. Decodificar el token desde Base64
            string decodedToken;
            try
            {
                var tokenBytes = Convert.FromBase64String(token);
                decodedToken = System.Text.Encoding.UTF8.GetString(tokenBytes);
            }
            catch
            {
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Token de verificación inválido o corrupto.");
            }

            // 2. Parsear el token (formato: email:codigo:idVerificacion)
            var tokenParts = decodedToken.Split(':');
            if (tokenParts.Length != 3)
            {
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Token de verificación con formato inválido.");
            }

            var email = tokenParts[0];
            var codigoPlano = tokenParts[1];
            
            // Validar que idVerificacion sea un número válido
            if (!int.TryParse(tokenParts[2], out int _))
            {
                return Response<VerifyOtpResponseDTO>.Failure(
                    "Token de verificación inválido.");
            }

            // 3. Usar el método existente de verificación con hash
            return await VerifyOtpAsync(email, codigoPlano);
        }
        catch (Exception ex)
        {
            return Response<VerifyOtpResponseDTO>.Failure(
                $"Error al procesar el token de verificación: {ex.Message}");
        }
    }

    public async Task<Response<OtpResponseDTO>> ResendOtpAsync(string email)
    {
        // Reutilizar la lógica de envío
        return await SendOtpEmailAsync(email);
    }

    public async Task<bool> IsEmailRecentlyVerifiedAsync(string email)
    {
        return await _otpRepository.IsEmailVerifiedAsync(email);
    }

    private string GenerateOtpEmailTemplate(string verificationToken, string nombrePostulante)
    {
        // URL del frontend donde se procesará la verificación
        var frontendUrl = "http://localhost:4200"; // TODO: Mover a configuración 
        var verificationUrl = $"{frontendUrl}/verify-email-token?token={Uri.EscapeDataString(verificationToken)}";
        
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
        .verify-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(26, 35, 126, 0.5);
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
        .warning-box .icon {{
            font-size: 20px;
            margin-right: 10px;
        }}
        .info-box {{
            background-color: #e3f2fd;
            border-left: 5px solid #2196f3;
            padding: 20px;
            margin: 25px 0;
            border-radius: 6px;
        }}
        .info-box strong {{
            color: #1565c0;
            display: block;
            margin-bottom: 10px;
            font-size: 15px;
        }}
        .info-box ul {{
            margin: 10px 0 0 0;
            padding-left: 25px;
            color: #424242;
        }}
        .info-box li {{
            margin: 8px 0;
            font-size: 14px;
        }}
        .alternative-link {{
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }}
        .alternative-link p {{
            font-size: 13px;
            color: #666;
            margin: 5px 0;
        }}
        .alternative-link a {{
            color: #1a237e;
            word-break: break-all;
            font-size: 12px;
        }}
        .signature {{
            margin-top: 35px;
            color: #666;
            font-size: 15px;
        }}
        .signature strong {{
            color: #1a237e;
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
        @media only screen and (max-width: 600px) {{
            .container {{
                margin: 0;
                border-radius: 0;
            }}
            .header {{
                padding: 30px 20px;
            }}
            .content {{
                padding: 30px 20px;
            }}
            .verify-button {{
                padding: 15px 35px;
                font-size: 16px;
            }}
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
                <p>Para garantizar la seguridad de tu información y verificar que este correo electrónico te pertenece, por favor haz clic en el siguiente botón:</p>
            </div>
            
            <div class='button-container'>
                <a href='{verificationUrl}' class='verify-button' style='color: white !important;'>
                    🔐 Verificar mi Email
                </a>
            </div>
            
            <div class='warning-box'>
                <p>
                    <span class='icon'>⚠️</span>
                    Este enlace expirará en <strong>{OTP_EXPIRATION_MINUTES} minutos</strong>
                </p>
            </div>
        
        <div class='footer'>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p class='copyright'>© 2026 AMMI Online. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>";
    }
}
