using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace AMMI_Online_API.Application.Features.Segurity.Handlers;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Response<LoginResponseDTO>>
{
    private readonly IAuthRepository _authRepository;
    private readonly IRolOperacionRepository _rolOperacionRepository;
    private readonly IModuloOperacionRepository _moduloOperacionRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(
        IAuthRepository authRepository,
        IRolOperacionRepository rolOperacionRepository,
        IModuloOperacionRepository moduloOperacionRepository,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _authRepository = authRepository;
        _rolOperacionRepository = rolOperacionRepository;
        _moduloOperacionRepository = moduloOperacionRepository;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<Response<LoginResponseDTO>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // 1. Buscar usuario
        var usuario = await _authRepository.GetByUsernameAsync(
            request.Request.Username,
            cancellationToken);

        if (usuario == null)
            return Response<LoginResponseDTO>.Failure("Usuario o contraseña incorrectos");

        // 2. Verificar contraseña con BCrypt
        if (!_passwordHasher.VerifyPassword(request.Request.Password, usuario.Contrasenia))
            return Response<LoginResponseDTO>.Failure("Usuario o contraseña incorrectos");

        // 3. Verificar si el usuario está inactivo o bloqueado
        if (usuario.IdPersonaNavigation != null && !usuario.IdPersonaNavigation.Activo)
            return Response<LoginResponseDTO>.Failure("El usuario se encuentra inactivo o bloqueado");

        // 3. Obtener roles del usuario directamente
        var rolesUsuario = await _authRepository.GetRolesUsuarioAsync(usuario.IdPersona, cancellationToken);

        // 4. Verificar que tenga al menos un rol
        if (rolesUsuario == null || !rolesUsuario.Any())
            return Response<LoginResponseDTO>.Failure("El usuario no tiene roles asignados. Contacte al administrador.");

        // 5. Mapear roles a DTO
        var roles = rolesUsuario.Select(ru => new RolInfoDTO
        {
            IdRol = ru.IdRol,
            Nombre = ru.IdRolNavigation?.Detalle ?? "Sin nombre"
        }).ToList();

        // 6. Obtener permisos del usuario (Optimizado - Un solo query)
        var modulosOperaciones = await _authRepository.GetPermisosUsuarioAsync(usuario.IdPersona, cancellationToken);

        var permisos = modulosOperaciones
            .Select(mo => new PermisoDTO
            {
                IdModulo = mo.IdModulo,
                NombreModulo = mo.IdModuloNavigation?.Detalle ?? "",
                IdOperacion = mo.IdOperacion,
                NombreOperacion = mo.IdOperacionNavigation?.Detalle ?? ""
            })
            .GroupBy(p => new { p.IdModulo, p.IdOperacion })
            .Select(g => g.First())
            .ToList();

        // 7. Generar tokens
        var token = _jwtService.GenerateToken(usuario.IdPersona, usuario.Username, roles, permisos, usuario.RequiereCambioContrasenia);
        var refreshToken = _jwtService.GenerateRefreshToken();

        // 8. Construir respuesta
        var response = new LoginResponseDTO
        {
            IdPersona = usuario.IdPersona,
            Username = usuario.Username,
            Token = token,
            TokenExpiration = _jwtService.GetTokenExpiration(),
            RefreshToken = refreshToken,
            Roles = roles,
            Permisos = permisos,
            RequiereCambioContrasenia = usuario.RequiereCambioContrasenia
        };

        return Response<LoginResponseDTO>.Success(response, "Inicio de sesión exitoso");
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Response<int>>
{
    private readonly IAuthRepository _authRepository;
    private readonly IRolRepository _rolRepository;
    private readonly IRolUsuarioRepository _rolUsuarioRepository;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterCommandHandler(
        IAuthRepository authRepository,
        IRolRepository rolRepository,
        IRolUsuarioRepository rolUsuarioRepository,
        IPasswordHasher passwordHasher)
    {
        _authRepository = authRepository;
        _rolRepository = rolRepository;
        _rolUsuarioRepository = rolUsuarioRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Response<int>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // 1. Verificar que el rol exista
        if (!await _rolRepository.ExistsAsync(request.Request.IdRol, cancellationToken))
            return Response<int>.Failure("El rol especificado no existe");

        // 2. Generar username único (agrega x1, x2, etc. si ya existe)
        var usernameUnico = await _authRepository.GenerarUsernameUnicoAsync(request.Request.Username, cancellationToken);

        // 3. Hashear la contraseña
        var hashedPassword = _passwordHasher.HashPassword(request.Request.Password);

        // 4. Crear usuario
        var usuario = new Usuario
        {
            IdPersona = request.Request.IdPersona,
            Username = usernameUnico,
            Contrasenia = hashedPassword,
            RequiereCambioContrasenia = true
        };

        var createdUser = await _authRepository.CreateUserAsync(usuario, cancellationToken);

        // 5. Asignar rol obligatorio
        var rolUsuario = new RolUsuario
        {
            IdPersona = createdUser.IdPersona,
            IdRol = request.Request.IdRol
        };

        await _rolUsuarioRepository.AddAsync(rolUsuario, cancellationToken);

        return Response<int>.Success(createdUser.IdPersona, $"Usuario registrado correctamente con username: {usernameUnico}");
    }
}

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, Response<bool>>
{
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(
        IAuthRepository authRepository,
        IPasswordHasher passwordHasher)
    {
        _authRepository = authRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Response<bool>> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar que las contraseñas nuevas coincidan
        if (request.Request.NewPassword != request.Request.ConfirmNewPassword)
            return Response<bool>.Failure("Las contraseñas nuevas no coinciden");

        // 2. Hashear nueva contraseña
        var newHashedPassword = _passwordHasher.HashPassword(request.Request.NewPassword);

        // 3. Actualizar contraseña usando el IdPersona del token JWT
        var updated = await _authRepository.UpdatePasswordAsync(
            request.IdPersona,
            newHashedPassword,
            cancellationToken);

        return updated
            ? Response<bool>.Success(true, "Contraseña actualizada correctamente")
            : Response<bool>.Failure("No se pudo actualizar la contraseña");
    }
}


public class CambiarContraseniaFirstLoginCommandHandler : IRequestHandler<CambiarContraseniaFirstLoginCommand, Response<bool>>
{
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordHasher _passwordHasher;

    public CambiarContraseniaFirstLoginCommandHandler(
        IAuthRepository authRepository,
        IPasswordHasher passwordHasher)
    {
        _authRepository = authRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Response<bool>> Handle(CambiarContraseniaFirstLoginCommand request, CancellationToken cancellationToken)
    {
        // 1. Obtener usuario
        var usuario = await _authRepository.GetByIdPersonaAsync(request.IdPersona, cancellationToken);

        if (usuario == null)
            return Response<bool>.Failure("Usuario no encontrado.");

        // 2. Verificar que el cambio de contraseña sea requerido
        if (!usuario.RequiereCambioContrasenia)
            return Response<bool>.Failure("El usuario no requiere cambio de contraseña en este momento.");

        // 3. Validar que las contraseñas coincidan
        if (request.Request.NuevaContrasenia != request.Request.ConfirmarNuevaContrasenia)
            return Response<bool>.Failure("Las contraseñas no coinciden.");

        // 4. Validar que la nueva contraseña no sea igual al username (número de documento)
        if (request.Request.NuevaContrasenia == usuario.Username)
            return Response<bool>.Failure("La contraseña no puede ser igual al nombre de usuario.");

        // 5. Validar complejidad mínima
        if (request.Request.NuevaContrasenia.Length < 8)
            return Response<bool>.Failure("La contraseña debe tener al menos 8 caracteres.");

        if (!request.Request.NuevaContrasenia.Any(char.IsDigit))
            return Response<bool>.Failure("La contraseña debe contener al menos un número.");

        if (!request.Request.NuevaContrasenia.Any(char.IsUpper))
            return Response<bool>.Failure("La contraseña debe contener al menos una letra mayúscula.");

        // 6. Hashear y actualizar contraseña
        var newHashedPassword = _passwordHasher.HashPassword(request.Request.NuevaContrasenia);
        await _authRepository.UpdatePasswordAsync(request.IdPersona, newHashedPassword, cancellationToken);

        // 7. Desactivar el flag
        await _authRepository.SetRequiereCambioContraseniaAsync(request.IdPersona, false, cancellationToken);

        return Response<bool>.Success(true, "Contraseña actualizada correctamente. Ya puede acceder al sistema.");
    }
}

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Response<bool>>
{
    private readonly IAuthRepository _authRepository;
    private readonly IEmailService _emailService;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;

    public ForgotPasswordCommandHandler(
        IAuthRepository authRepository,
        IEmailService emailService,
        IJwtService jwtService,
        IConfiguration configuration)
    {
        _authRepository = authRepository;
        _emailService = emailService;
        _jwtService = jwtService;
        _configuration = configuration;
    }

    public async Task<Response<bool>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        // 1. Buscar usuario por Username incluyendo Persona -> DatosContacto
        var usuario = await _authRepository.GetByUsernameWithContactoAsync(request.Request.Username, cancellationToken);

        // 2. Si no existe, retornar éxito genérico (seguridad)
        if (usuario == null)
            return Response<bool>.Success(true, "Si el usuario existe, se ha enviado un correo de recuperación");

        // 3. Obtener email (ID 1 es Email según plan y código existente)
        var email = usuario.IdPersonaNavigation?.DatosContacto
            .FirstOrDefault(dc => dc.IdTipoDatoContacto == 1 || dc.Detalle.Contains("@"))?.Detalle;

        if (string.IsNullOrEmpty(email))
            return Response<bool>.Success(true, "Si el usuario existe, se ha enviado un correo de recuperación");

        // 4. Generar token opaco
        var token = _jwtService.GenerateRefreshToken();
        var expiry = DateTime.UtcNow.AddHours(1);

        // 5. Guardar en DB
        await _authRepository.SaveResetTokenAsync(usuario.IdPersona, token, expiry, cancellationToken);

        // 6. Construir URL (token debe ir URL-encodeado porque Base64 contiene +, /, =)
        var baseUrl = _configuration["FrontendSettings:BaseUrl"] ?? "http://localhost:4200";
        var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(token)}";

        // 7. Enviar email
        var asunto = "Recuperación de Contraseña - AMMI Online";
        var cuerpo = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                <h2 style='color: #007bff;'>Recuperación de Contraseña</h2>
                <p>Usted ha solicitado restablecer su contraseña para acceder a <strong>AMMI Online</strong>.</p>
                <p>Haga clic en el siguiente botón para continuar con el proceso:</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='{resetUrl}' style='background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Restablecer Contraseña</a>
                </div>
                <p>Este enlace expirará en 1 hora. Si usted no solicitó este cambio, puede ignorar este mensaje.</p>
                <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                <p style='font-size: 12px; color: #777;'>O copie y pegue el siguiente enlace en su navegador:</p>
                <p style='font-size: 12px; color: #777;'>{resetUrl}</p>
            </div>";

        await _emailService.SendEmailAsync(email, asunto, cuerpo, true, cancellationToken);

        return Response<bool>.Success(true, "Si el usuario existe, se ha enviado un correo de recuperación");
    }
}

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Response<bool>>
{
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordCommandHandler(
        IAuthRepository authRepository,
        IPasswordHasher passwordHasher)
    {
        _authRepository = authRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Response<bool>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar que las contraseñas coincidan
        if (request.Request.NewPassword != request.Request.ConfirmNewPassword)
            return Response<bool>.Failure("Las contraseñas no coinciden");

        // 2. Buscar por token
        var usuario = await _authRepository.GetByResetTokenAsync(request.Request.Token, cancellationToken);

        // 3. Validar existencia y expiración
        if (usuario == null)
            return Response<bool>.Failure("El token de recuperación es inválido");

        if (usuario.ResetPasswordTokenExpiry < DateTime.UtcNow)
            return Response<bool>.Failure("El token de recuperación ha expirado");

        // 4. Hashear y actualizar
        var hashedPassword = _passwordHasher.HashPassword(request.Request.NewPassword);
        await _authRepository.UpdatePasswordAsync(usuario.IdPersona, hashedPassword, cancellationToken);

        // 5. Limpiar token
        await _authRepository.ClearResetTokenAsync(usuario.IdPersona, cancellationToken);

        return Response<bool>.Success(true, "Contraseña restablecida correctamente");
    }
}
