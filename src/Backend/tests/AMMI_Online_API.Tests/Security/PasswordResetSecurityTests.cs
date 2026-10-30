using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Handlers;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AMMI_Online_API.Tests.Security;

public class PasswordResetSecurityTests
{
    private readonly Mock<IAuthRepository> _authRepoMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IAuthSecurityService> _securityServiceMock;
    private readonly Mock<ILogger<ForgotPasswordCommandHandler>> _forgotLoggerMock;
    private readonly Mock<ILogger<ResetPasswordCommandHandler>> _resetLoggerMock;
    private readonly IConfiguration _configuration;

    public PasswordResetSecurityTests()
    {
        _authRepoMock = new Mock<IAuthRepository>();
        _emailServiceMock = new Mock<IEmailService>();
        _jwtServiceMock = new Mock<IJwtService>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _securityServiceMock = new Mock<IAuthSecurityService>();
        _forgotLoggerMock = new Mock<ILogger<ForgotPasswordCommandHandler>>();
        _resetLoggerMock = new Mock<ILogger<ResetPasswordCommandHandler>>();

        _securityServiceMock.Setup(s => s.GetCurrentClientIp()).Returns("192.168.1.10");
        _securityServiceMock.Setup(s => s.IsActionLockedOut(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>())).Returns(false);
        _securityServiceMock.Setup(s => s.IsIpLockedOut(It.IsAny<string>())).Returns(false);

        var config = new Dictionary<string, string?>
        {
            { "FrontendSettings:BaseUrl", "http://localhost:4200" }
        };
        _configuration = new ConfigurationBuilder().AddInMemoryCollection(config).Build();
    }

    [Fact]
    public async Task ForgotPassword_UsuarioInexistente_RetornaExitoGenericoSinRevelarInexistencia()
    {
        // Arrange
        _authRepoMock.Setup(r => r.GetByUsernameWithContactoAsync("fantasma", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Usuario?)null);

        var handler = new ForgotPasswordCommandHandler(
            _authRepoMock.Object,
            _emailServiceMock.Object,
            _jwtServiceMock.Object,
            _configuration,
            _securityServiceMock.Object,
            _forgotLoggerMock.Object);

        var command = new ForgotPasswordCommand(new ForgotPasswordRequestDTO { Username = "fantasma" });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert: Devuelve éxito genérico para no revelar si existe el usuario
        Assert.True(result.IsSuccess);
        Assert.Contains("Si el usuario existe", result.Message);
        _emailServiceMock.Verify(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ForgotPassword_CuandoSuperaLimiteAcciones_RetornaFalloPorTasa()
    {
        // Arrange
        _securityServiceMock.Setup(s => s.IsActionLockedOut("forgot-password", "usuario.abuso", "192.168.1.10"))
            .Returns(true);

        var handler = new ForgotPasswordCommandHandler(
            _authRepoMock.Object,
            _emailServiceMock.Object,
            _jwtServiceMock.Object,
            _configuration,
            _securityServiceMock.Object,
            _forgotLoggerMock.Object);

        var command = new ForgotPasswordCommand(new ForgotPasswordRequestDTO { Username = "usuario.abuso" });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("Demasiadas solicitudes", result.Message);
    }

    [Fact]
    public async Task ResetPassword_ConTokenInvalido_RetornaFalloYRegistraFallo()
    {
        // Arrange
        _authRepoMock.Setup(r => r.GetByResetTokenAsync("token-invalido", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Usuario?)null);

        var handler = new ResetPasswordCommandHandler(
            _authRepoMock.Object,
            _passwordHasherMock.Object,
            _securityServiceMock.Object,
            _resetLoggerMock.Object);

        var command = new ResetPasswordCommand(new ResetPasswordRequestDTO
        {
            Token = "token-invalido",
            NewPassword = "NuevaPassword123!",
            ConfirmNewPassword = "NuevaPassword123!"
        });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("inválido", result.Message);
        _securityServiceMock.Verify(s => s.RecordFailedAttempt("reset-token-invalido", "192.168.1.10"), Times.Once);
    }

    [Fact]
    public async Task ResetPassword_ConTokenExpirado_RetornaFalloYRegistraFallo()
    {
        // Arrange
        var usuario = new Usuario
        {
            IdPersona = 10,
            Username = "usuario.expirado",
            ResetPasswordToken = "token-expirado",
            ResetPasswordTokenExpiry = DateTime.UtcNow.AddMinutes(-5) // Expirado hace 5 min
        };

        _authRepoMock.Setup(r => r.GetByResetTokenAsync("token-expirado", It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        var handler = new ResetPasswordCommandHandler(
            _authRepoMock.Object,
            _passwordHasherMock.Object,
            _securityServiceMock.Object,
            _resetLoggerMock.Object);

        var command = new ResetPasswordCommand(new ResetPasswordRequestDTO
        {
            Token = "token-expirado",
            NewPassword = "NuevaPassword123!",
            ConfirmNewPassword = "NuevaPassword123!"
        });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("expirado", result.Message);
        _securityServiceMock.Verify(s => s.RecordFailedAttempt(usuario.Username, "192.168.1.10"), Times.Once);
    }

    [Fact]
    public async Task ResetPassword_ConTokenValido_ActualizaContraseniaEInvalidaTokenParaUnSoloUso()
    {
        // Arrange
        var usuario = new Usuario
        {
            IdPersona = 12,
            Username = "usuario.valido",
            ResetPasswordToken = "token-valido-123",
            ResetPasswordTokenExpiry = DateTime.UtcNow.AddMinutes(30)
        };

        _authRepoMock.Setup(r => r.GetByResetTokenAsync("token-valido-123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);
        _passwordHasherMock.Setup(p => p.HashPassword("NuevaPassword123!"))
            .Returns("hash-nueva-password");

        var handler = new ResetPasswordCommandHandler(
            _authRepoMock.Object,
            _passwordHasherMock.Object,
            _securityServiceMock.Object,
            _resetLoggerMock.Object);

        var command = new ResetPasswordCommand(new ResetPasswordRequestDTO
        {
            Token = "token-valido-123",
            NewPassword = "NuevaPassword123!",
            ConfirmNewPassword = "NuevaPassword123!"
        });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        _authRepoMock.Verify(r => r.UpdatePasswordAsync(12, "hash-nueva-password", It.IsAny<CancellationToken>()), Times.Once);
        // Se invalida el token eliminándolo de la base de datos tras usarse
        _authRepoMock.Verify(r => r.ClearResetTokenAsync(12, It.IsAny<CancellationToken>()), Times.Once);
        _securityServiceMock.Verify(s => s.ResetFailedAttempts(usuario.Username, "192.168.1.10"), Times.Once);
    }

    [Fact]
    public async Task ResetPassword_CuandoIpEstaBloqueada_RetornaBloqueoSinConsultarBaseDatos()
    {
        // Arrange
        _securityServiceMock.Setup(s => s.IsIpLockedOut("192.168.1.10")).Returns(true);

        var handler = new ResetPasswordCommandHandler(
            _authRepoMock.Object,
            _passwordHasherMock.Object,
            _securityServiceMock.Object,
            _resetLoggerMock.Object);

        var command = new ResetPasswordCommand(new ResetPasswordRequestDTO
        {
            Token = "cualquier-token",
            NewPassword = "Password123!",
            ConfirmNewPassword = "Password123!"
        });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("Demasiados intentos fallidos", result.Message);
        _authRepoMock.Verify(r => r.GetByResetTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
