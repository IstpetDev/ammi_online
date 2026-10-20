namespace AMMI_Online_API.Application.DTOs.Segurity;

public record LoginRequestDTO
{
    public required string Username { get; init; }
    public required string Password { get; init; }
}

public record LoginResponseDTO
{
    public int IdPersona { get; init; }
    public string Username { get; init; }
    public string Token { get; init; }
    public DateTime TokenExpiration { get; init; }
    public string RefreshToken { get; init; }
    public IEnumerable<RolInfoDTO> Roles { get; init; }
    public IEnumerable<PermisoDTO> Permisos { get; init; }
    public bool RequiereCambioContrasenia { get; init; }
}

public record RolInfoDTO
{
    public int IdRol { get; init; }
    public string Nombre { get; init; }
}

public record PermisoDTO
{
    public int IdModulo { get; init; }
    public string NombreModulo { get; init; }
    public int IdOperacion { get; init; }
    public string NombreOperacion { get; init; }
}

public record RegisterRequestDTO
{
    public required int IdPersona { get; init; }
    public required string Username { get; init; }
    public required string Password { get; init; }
    public required int IdRol { get; init; }
}

public record RefreshTokenRequestDTO
{
    public required string Token { get; init; }
    public required string RefreshToken { get; init; }
}

public record ChangePasswordDTO
{
    public required string CurrentPassword { get; init; }
    public required string NewPassword { get; init; }
    public required string ConfirmNewPassword { get; init; }
}

public record HashPasswordRequestDTO
{
    public required string Password { get; init; }
}

public record HashPasswordResponseDTO
{
    public string OriginalPassword { get; init; }
    public string HashedPassword { get; init; }
    public string Algorithm { get; init; }
    public int WorkFactor { get; init; }
    public DateTime GeneratedAt { get; init; }
}

public record VerifyPasswordRequestDTO
{
    public required string Password { get; init; }
    public required string HashedPassword { get; init; }
}

public record VerifyPasswordResponseDTO
{
    public bool IsMatch { get; init; }
    public string Message { get; init; }
    public string PasswordProvided { get; init; }
    public string HashProvided { get; init; }
}

public record CambiarContraseniaFirstLoginDTO
{
    public required string NuevaContrasenia { get; init; }
    public required string ConfirmarNuevaContrasenia { get; init; }
}

public record ForgotPasswordRequestDTO
{
    public required string Username { get; init; }
}

public record ResetPasswordRequestDTO
{
    public required string Token { get; init; }
    public required string NewPassword { get; init; }
    public required string ConfirmNewPassword { get; init; }
}
