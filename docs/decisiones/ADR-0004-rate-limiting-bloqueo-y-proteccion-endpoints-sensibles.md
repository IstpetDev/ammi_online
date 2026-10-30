# ADR-0004: Limitación de tasa (Rate Limiting), bloqueo temporal por fuerza bruta y protección de endpoints sensibles

Fecha: 2026-10-30

Estado: Aceptado

## Contexto

El Issue #24 identificó la ausencia de mecanismos de control de tasa de peticiones (`AddRateLimiter`), bloqueo temporal ante ataques de fuerza bruta y gestión del ciclo de vida de tokens de un solo uso en la API de AMMI Online. 

Los vectores de riesgo principales correspondían a:
1. **Fuerza bruta contra credenciales** en `/api/Auth/login`.
2. **Abuso y spam de correos** en recuperación de contraseñas (`/api/Auth/forgot-password`) y verificación de correo/OTP (`/api/EmailVerification/send-otp` y `resend-otp`).
3. **Ataques de adivinación de códigos OTP y tokens de recuperación** (`verify-otp`, `verify-email-token`, `reset-password`).
4. **Fuga de información y enumeración de usuarios** al emitir mensajes de error diferenciados según la existencia o no de cuentas.
5. **Riesgo de IP spoofing detrás de proxies inversos** si se procesan encabezados `X-Forwarded-For` sin verificar proxies de confianza.
6. **Exposición de credenciales o tokens en logs** ante eventos de fallo.

## Decisión

1. **Soporte de Proxies de Confianza e IP Real (`ForwardedHeaders`):**
   - Se configuró el middleware `ForwardedHeadersMiddleware` (`AddForwardedHeadersConfiguration` en `Program.cs`), posicionado como primer componente del pipeline HTTP.
   - Procesa `ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto` restringido a proxies conocidos (`KnownProxies`) y redes seguras (`KnownNetworks`) configurables en `ForwardedHeaders`, con `ForwardLimit = 1` por defecto, garantizando que `HttpContext.Connection.RemoteIpAddress` refleje la IP real sin permitir spoofing.

2. **Middleware Nativo de Rate Limiting (`Microsoft.AspNetCore.RateLimiting` .NET 8):**
   - Se implementó `AddCustomRateLimiting` definiendo políticas por ventana deslizante (*Sliding Window*) particionadas por la IP real del cliente:
     - `auth-policy`: 10 peticiones/minuto para endpoints de autenticación y credenciales (`Login`, `Register`, `ForgotPassword`, `ResetPassword`).
     - `otp-policy`: 5 peticiones/minuto para endpoints de verificación de correo (`send-otp`, `resend-otp`, `verify-otp`, `verify-email-token`, `check-email-verified`).
     - `catalog-policy`: 120 peticiones/minuto para catálogos públicos.
   - Respuestas con código HTTP 429 (*Too Many Requests*), encabezado `Retry-After` y payload JSON uniforme (`Response<object>.Failure`).

3. **Servicio Centralizado de Seguridad y Bloqueo Temporal (`IAuthSecurityService`):**
   - Se diseñó e implementó `AuthSecurityService` respaldado por `IMemoryCache`:
     - Rastreo independiente y concurrente de intentos fallidos por **cuenta/identificador** y por **IP**.
     - Bloqueo temporal automático tras 5 fallos consecutivos durante una ventana de 15 minutos (configurable en `AuthSecurity`).
     - Respuestas neutras e idénticas tanto para cuentas existentes con contraseña errónea como para cuentas inexistentes (`"Usuario o contraseña incorrectos"`), y mensaje neutro idéntico ante bloqueo temporal (`"Demasiados intentos fallidos. Su acceso ha sido bloqueado temporalmente por motivos de seguridad. Por favor, intente más tarde."`), erradicando la enumeración de usuarios.
     - Restablecimiento automático de contadores tras autenticación o verificación exitosa.

4. **Caducidad e Invalidación Inmediata de Tokens (Single-Use):**
   - **Tokens de recuperación de contraseña:** Caducan en 1 hora (`ResetPasswordTokenExpiry`). Al procesarse un reseteo exitoso en `ResetPasswordCommandHandler`, se llama a `ClearResetTokenAsync`, eliminando el token de la base de datos de modo que cualquier segundo intento con el mismo token es rechazado de inmediato.
   - **Códigos OTP y tokens de verificación de correo:** Caducan en 10 minutos (`FechaExpiracion`). Al verificarse exitosamente en `OtpService`, se actualiza `EsVerificado = 1ul` en la base de datos; la consulta `GetActiveOtpAsync` solo recupera registros con `EsVerificado = 0ul`, impidiendo su reutilización.

5. **Registro de Auditoría Seguro (Sin Contraseñas ni Tokens):**
   - Todos los manejadores (`LoginCommandHandler`, `ForgotPasswordCommandHandler`, `ResetPasswordCommandHandler`, `OtpService`) registran intentos fallidos y bloqueos mediante `ILogger`.
   - Los mensajes incluyen únicamente identificadores de cuenta (username, email), IP de origen y motivo técnico sanitizado, excluyendo rigurosamente contraseñas y tokens.

6. **Cobertura de Pruebas Automatizadas:**
   - Se añadieron pruebas unitarias exhaustivas en `AMMI_Online_API.Tests.Security`:
     * `AuthSecurityServiceTests`: pruebas de umbrales, expiración de ventanas, bloqueo dual por cuenta/IP y neutralidad de mensajes.
     * `LoginCommandHandlerTests`: verificación de registro de fallos, bloqueo antes de consulta a DB, y no divulgación de existencia de usuarios.
     * `PasswordResetSecurityTests`: comprobación de expiración, invalidación tras primer uso e inmunidad ante reuso de tokens.
     * `OtpSecurityTests`: verificación de límites diarios, cooldown, invalidación tras uso y rechazo de tokens alterados.
     * `ForwardedHeadersAndRateLimiterTests`: validación de opciones de proxy y rechazo 429 con cabecera `Retry-After`.
     * `AnonymousEndpointsPolicyTests`: verificación de whitelist actualizada incluyendo `ForgotPassword` y `ResetPassword`.

## Consecuencias

- Blindaje integral del backend contra ataques automatizados de fuerza bruta, ataques de diccionario y bombardeo de correos electrónicos (email bombing).
- Prevención total de ataques de enumeración de usuarios en los flujos de inicio de sesión y recuperación.
- Garantía de consumo único de credenciales temporales (OTP y enlaces de reseteo).
- Compatibilidad transparente con infraestructuras proxy existentes (IIS, Nginx, Cloudflare) mediante configuración desacoplada en `appsettings.json`.
