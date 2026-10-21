using System.ComponentModel.DataAnnotations;

namespace AMMI_Online_API.Application.DTOs.Segurity;

/// <summary>
/// DTO para solicitar el envío de un código OTP
/// </summary>
public record SendOtpRequestDTO
{
    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    [MaxLength(255, ErrorMessage = "El email no puede exceder 255 caracteres")]
    public required string Email { get; init; }

    [MaxLength(200, ErrorMessage = "El nombre del postulante no puede exceder 200 caracteres")]
    public string? NombrePostulante { get; init; }
}

/// <summary>
/// DTO para verificar un código OTP
/// </summary>
public record VerifyOtpRequestDTO
{
    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    public required string Email { get; init; }

    [Required(ErrorMessage = "El código OTP es requerido")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "El código debe tener 6 dígitos")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "El código debe contener solo números")]
    public required string Codigo { get; init; }
}

/// <summary>
/// DTO de respuesta al enviar o reenviar un código OTP
/// </summary>
public record OtpResponseDTO
{
    public bool Enviado { get; init; }
    public string Mensaje { get; init; } = string.Empty;
    public DateTime? FechaExpiracion { get; init; }
    public int IntentosRestantes { get; init; }
}

/// <summary>
/// DTO de respuesta al verificar un código OTP
/// </summary>
public record VerifyOtpResponseDTO
{
    public bool Verificado { get; init; }
    public string Mensaje { get; init; } = string.Empty;
}
