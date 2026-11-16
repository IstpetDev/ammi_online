using System.Net;
using AMMI_Online_API.Application.Common.Security;
using AMMI_Online_API.Application.Services.Implementations;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AMMI_Online_API.Tests.Security;

public class AuthSecurityServiceTests
{
    private readonly IMemoryCache _memoryCache;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<ILogger<AuthSecurityService>> _loggerMock;
    private readonly IConfiguration _configuration;

    public AuthSecurityServiceTests()
    {
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _loggerMock = new Mock<ILogger<AuthSecurityService>>();

        var configData = new Dictionary<string, string?>
        {
            { "AuthSecurity:MaxFailedAttempts", "3" },
            { "AuthSecurity:LockoutDurationMinutes", "10" },
            { "AuthSecurity:FailedAttemptWindowMinutes", "10" },
            { "AuthSecurity:MaxActionAttempts", "3" },
            { "AuthSecurity:ActionWindowMinutes", "10" }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();
    }

    private AuthSecurityService CreateService()
    {
        return new AuthSecurityService(
            _memoryCache,
            _httpContextAccessorMock.Object,
            _configuration,
            _loggerMock.Object);
    }

    [Fact]
    public void RecordFailedAttempt_BloqueaCuentaYIpTrasNIntentos()
    {
        // Arrange
        var service = CreateService();
        const string username = "usuario.test";
        const string ip = "192.168.10.5";

        // Act & Assert: Intentos 1 y 2 no bloquean
        Assert.False(service.RecordFailedAttempt(username, ip));
        Assert.False(service.IsLoginLockedOut(username, ip));

        Assert.False(service.RecordFailedAttempt(username, ip));
        Assert.False(service.IsLoginLockedOut(username, ip));

        // Intento 3 alcanza el umbral de 3 fallos -> bloquea
        Assert.True(service.RecordFailedAttempt(username, ip));
        Assert.True(service.IsLoginLockedOut(username, ip));
        Assert.True(service.IsAccountLockedOut(username));
        Assert.True(service.IsIpLockedOut(ip));
    }

    [Fact]
    public void ResetFailedAttempts_DesbloqueaCuentaEIp()
    {
        // Arrange
        var service = CreateService();
        const string username = "usuario.bloqueado";
        const string ip = "10.0.0.99";

        // Provocar bloqueo
        service.RecordFailedAttempt(username, ip);
        service.RecordFailedAttempt(username, ip);
        service.RecordFailedAttempt(username, ip);
        Assert.True(service.IsLoginLockedOut(username, ip));

        // Act
        service.ResetFailedAttempts(username, ip);

        // Assert
        Assert.False(service.IsLoginLockedOut(username, ip));
        Assert.False(service.IsAccountLockedOut(username));
        Assert.False(service.IsIpLockedOut(ip));
    }

    [Fact]
    public void MensajesNeutros_NoRevelanInformacionDeUsuario()
    {
        // Arrange
        var service = CreateService();

        // Act
        var invalidCredsMsg = service.GetInvalidCredentialsMessage();
        var lockoutMsg = service.GetLockoutMessage();

        // Assert
        Assert.Equal("Usuario o contraseña incorrectos", invalidCredsMsg);
        Assert.Contains("bloqueado temporalmente", lockoutMsg);
        Assert.DoesNotContain("existe", lockoutMsg, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("usuario no existe", invalidCredsMsg, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void RecordActionAttempt_BloqueaAccionSensibleTrasSuperarLimite()
    {
        // Arrange
        var service = CreateService();
        const string actionKey = "forgot-password";
        const string email = "test@correo.com";
        const string ip = "192.168.1.1";

        // Act & Assert
        Assert.False(service.RecordActionAttempt(actionKey, email, ip));
        Assert.False(service.IsActionLockedOut(actionKey, email, ip));

        Assert.False(service.RecordActionAttempt(actionKey, email, ip));
        Assert.False(service.IsActionLockedOut(actionKey, email, ip));

        // 3er intento activa bloqueo de la acción
        Assert.True(service.RecordActionAttempt(actionKey, email, ip));
        Assert.True(service.IsActionLockedOut(actionKey, email, ip));
    }

    [Fact]
    public void GetCurrentClientIp_ResuelveIpDesdeHttpContext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = IPAddress.Parse("200.10.20.30");
        _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);

        var service = CreateService();

        // Act
        var ip = service.GetCurrentClientIp();

        // Assert
        Assert.Equal("200.10.20.30", ip);
    }
}
