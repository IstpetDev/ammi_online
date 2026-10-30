using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Application.Services.Implementations;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AMMI_Online_API.Tests.Security;

public class OtpSecurityTests
{
    private readonly Mock<IEmailVerificationOtpRepository> _otpRepoMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IAuthSecurityService> _securityServiceMock;
    private readonly Mock<ILogger<OtpService>> _loggerMock;
    private readonly IConfiguration _configuration;

    public OtpSecurityTests()
    {
        _otpRepoMock = new Mock<IEmailVerificationOtpRepository>();
        _emailServiceMock = new Mock<IEmailService>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _securityServiceMock = new Mock<IAuthSecurityService>();
        _loggerMock = new Mock<ILogger<OtpService>>();

        _securityServiceMock.Setup(s => s.GetCurrentClientIp()).Returns("192.168.1.15");
        _securityServiceMock.Setup(s => s.IsActionLockedOut(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>())).Returns(false);
        _securityServiceMock.Setup(s => s.IsLoginLockedOut(It.IsAny<string>(), It.IsAny<string?>())).Returns(false);

        var config = new Dictionary<string, string?>
        {
            { "FrontendSettings:BaseUrl", "http://localhost:4200" }
        };
        _configuration = new ConfigurationBuilder().AddInMemoryCollection(config).Build();
    }

    private OtpService CreateService()
    {
        return new OtpService(
            _otpRepoMock.Object,
            _emailServiceMock.Object,
            _passwordHasherMock.Object,
            _securityServiceMock.Object,
            _loggerMock.Object,
            _configuration);
    }

    [Fact]
    public async Task SendOtp_CuandoAccionBloqueadaPorTasa_RetornaFallo()
    {
        // Arrange
        const string email = "test@correo.com";
        _securityServiceMock.Setup(s => s.IsActionLockedOut("send-otp", email, "192.168.1.15"))
            .Returns(true);

        var service = CreateService();

        // Act
        var result = await service.SendOtpEmailAsync(email);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("Demasiadas solicitudes", result.Message);
        _otpRepoMock.Verify(r => r.CreateOtpAsync(It.IsAny<EmailVerificacionesOtp>()), Times.Never);
    }

    [Fact]
    public async Task SendOtp_CuandoSuperaLimiteDiario_RetornaFallo()
    {
        // Arrange
        const string email = "test@correo.com";
        _otpRepoMock.Setup(r => r.GetDailyAttemptsCountAsync(email))
            .ReturnsAsync(5); // Límite de 5 intentos diarios alcanzado

        var service = CreateService();

        // Act
        var result = await service.SendOtpEmailAsync(email);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("límite de 5 intentos diarios", result.Message);
    }

    [Fact]
    public async Task VerifyOtp_CuandoCuentaOIpBloqueadas_RetornaBloqueo()
    {
        // Arrange
        const string email = "test@correo.com";
        _securityServiceMock.Setup(s => s.IsLoginLockedOut(email, "192.168.1.15"))
            .Returns(true);

        var service = CreateService();

        // Act
        var result = await service.VerifyOtpAsync(email, "123456");

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("bloqueado temporalmente", result.Message);
        _otpRepoMock.Verify(r => r.GetActiveOtpAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task VerifyOtp_CuandoOtpExpirado_RetornaFalloYRegistraFallo()
    {
        // Arrange
        const string email = "test@correo.com";
        var otp = new EmailVerificacionesOtp
        {
            IdVerificacion = 1,
            Email = email,
            CodigoOtp = "hash",
            FechaExpiracion = DateTime.UtcNow.AddMinutes(-2), // Expirado
            IntentosRestantes = 3,
            EsVerificado = 0ul
        };

        _otpRepoMock.Setup(r => r.GetActiveOtpAsync(email))
            .ReturnsAsync(otp);

        var service = CreateService();

        // Act
        var result = await service.VerifyOtpAsync(email, "123456");

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("expirado", result.Message);
        _securityServiceMock.Verify(s => s.RecordFailedAttempt(email, "192.168.1.15"), Times.Once);
    }

    [Fact]
    public async Task VerifyOtp_ConCodigoIncorrecto_DecrementaIntentosYRegistraFallo()
    {
        // Arrange
        const string email = "test@correo.com";
        var otp = new EmailVerificacionesOtp
        {
            IdVerificacion = 2,
            Email = email,
            CodigoOtp = "hash-codigo-real",
            FechaExpiracion = DateTime.UtcNow.AddMinutes(5),
            IntentosRestantes = 3,
            EsVerificado = 0ul
        };

        _otpRepoMock.Setup(r => r.GetActiveOtpAsync(email))
            .ReturnsAsync(otp);
        _passwordHasherMock.Setup(p => p.VerifyPassword("codigo-erroneo", "hash-codigo-real"))
            .Returns(false);

        var service = CreateService();

        // Act
        var result = await service.VerifyOtpAsync(email, "codigo-erroneo");

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("inválido", result.Message);
        _otpRepoMock.Verify(r => r.DecrementIntentosAsync(2), Times.Once);
        _securityServiceMock.Verify(s => s.RecordFailedAttempt(email, "192.168.1.15"), Times.Once);
    }

    [Fact]
    public async Task VerifyOtp_ConCodigoCorrecto_InvalidaOtpParaReusoYRestableceIntentos()
    {
        // Arrange
        const string email = "test@correo.com";
        var otp = new EmailVerificacionesOtp
        {
            IdVerificacion = 3,
            Email = email,
            CodigoOtp = "hash-codigo-real",
            FechaExpiracion = DateTime.UtcNow.AddMinutes(5),
            IntentosRestantes = 3,
            EsVerificado = 0ul
        };

        _otpRepoMock.Setup(r => r.GetActiveOtpAsync(email))
            .ReturnsAsync(otp);
        _passwordHasherMock.Setup(p => p.VerifyPassword("123456", "hash-codigo-real"))
            .Returns(true);
        _otpRepoMock.Setup(r => r.VerifyOtpAsync(email, "hash-codigo-real"))
            .ReturnsAsync(true);

        var service = CreateService();

        // Act
        var result = await service.VerifyOtpAsync(email, "123456");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(result.Data?.Verificado);
        // Marcado como verificado (invalida el OTP para que no se use de nuevo)
        _otpRepoMock.Verify(r => r.VerifyOtpAsync(email, "hash-codigo-real"), Times.Once);
        _securityServiceMock.Verify(s => s.ResetFailedAttempts(email, "192.168.1.15"), Times.Once);
    }

    [Fact]
    public async Task VerifyOtpByToken_ConFormatoInvalido_RetornaFalloYRegistraFallo()
    {
        // Arrange
        var service = CreateService();
        // Token con Base64 inválido o partes insuficientes
        var invalidToken = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("solo:dos_partes"));

        // Act
        var result = await service.VerifyOtpByTokenAsync(invalidToken);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("formato inválido", result.Message);
        _securityServiceMock.Verify(s => s.RecordFailedAttempt("otp-token-invalido", "192.168.1.15"), Times.Once);
    }
}
