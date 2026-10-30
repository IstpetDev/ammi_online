using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Handlers;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using Moq;
using Xunit;

namespace AMMI_Online_API.Tests.Auth;

public class LoginCommandHandlerTests
{
    private readonly Mock<IAuthRepository> _authRepoMock;
    private readonly Mock<IRolOperacionRepository> _rolOpRepoMock;
    private readonly Mock<IModuloOperacionRepository> _modOpRepoMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _authRepoMock = new Mock<IAuthRepository>();
        _rolOpRepoMock = new Mock<IRolOperacionRepository>();
        _modOpRepoMock = new Mock<IModuloOperacionRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtServiceMock = new Mock<IJwtService>();

        _handler = new LoginCommandHandler(
            _authRepoMock.Object,
            _rolOpRepoMock.Object,
            _modOpRepoMock.Object,
            _passwordHasherMock.Object,
            _jwtServiceMock.Object);
    }

    [Fact]
    public async Task Login_ConCredencialesCorrectas_RetornaExitoYToken()
    {
        // Arrange
        const string username = "estudiante.activo";
        const string rawPassword = "PasswordSegura123!";
        const string hashedPassword = "$2a$11$hashedPasswordExample";
        const int idPersona = 42;

        var usuario = new Usuario
        {
            IdPersona = idPersona,
            Username = username,
            Contrasenia = hashedPassword,
            RequiereCambioContrasenia = false,
            IdPersonaNavigation = new Persona
            {
                IdPersona = idPersona,
                Activo = true
            }
        };

        var roles = new List<RolUsuario>
        {
            new()
            {
                IdPersona = idPersona,
                IdRol = 1,
                IdRolNavigation = new Rol { IdRol = 1, Detalle = "Estudiante" }
            }
        };

        var modulosOperaciones = new List<ModuloOperacion>
        {
            new()
            {
                IdModuloOperacion = 1,
                IdModulo = 10,
                IdOperacion = 20,
                EsActivo = true,
                IdModuloNavigation = new Modulo { IdModulo = 10, Detalle = "Matrículas" },
                IdOperacionNavigation = new Operacion { IdOperacion = 20, Detalle = "Ver" }
            }
        };

        _authRepoMock.Setup(r => r.GetByUsernameAsync(username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        _passwordHasherMock.Setup(p => p.VerifyPassword(rawPassword, hashedPassword))
            .Returns(true);

        _authRepoMock.Setup(r => r.GetRolesUsuarioAsync(idPersona, It.IsAny<CancellationToken>()))
            .ReturnsAsync(roles);

        _authRepoMock.Setup(r => r.GetPermisosUsuarioAsync(idPersona, It.IsAny<CancellationToken>()))
            .ReturnsAsync(modulosOperaciones);

        _jwtServiceMock.Setup(j => j.GenerateToken(idPersona, username, It.IsAny<IEnumerable<RolInfoDTO>>(), It.IsAny<IEnumerable<PermisoDTO>>(), false))
            .Returns("jwt.token.valido");

        _jwtServiceMock.Setup(j => j.GenerateRefreshToken())
            .Returns("refresh-token-valido");

        _jwtServiceMock.Setup(j => j.GetTokenExpiration())
            .Returns(DateTime.UtcNow.AddHours(2));

        var command = new LoginCommand(new LoginRequestDTO
        {
            Username = username,
            Password = rawPassword
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal("jwt.token.valido", result.Data.Token);
        Assert.Equal("refresh-token-valido", result.Data.RefreshToken);
        Assert.Equal(username, result.Data.Username);
        Assert.Single(result.Data.Roles);
        Assert.Equal("Estudiante", result.Data.Roles.First().Nombre);
    }

    [Fact]
    public async Task Login_ConUsuarioInexistente_RetornaFalloCredencialesIncorrectas()
    {
        // Arrange
        _authRepoMock.Setup(r => r.GetByUsernameAsync("usuario.fantasma", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Usuario?)null);

        var command = new LoginCommand(new LoginRequestDTO
        {
            Username = "usuario.fantasma",
            Password = "CualquierPassword123"
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("Usuario o contraseña incorrectos", result.Message);
        Assert.Null(result.Data);
    }

    [Fact]
    public async Task Login_ConContraseniaIncorrecta_RetornaFalloCredencialesIncorrectas()
    {
        // Arrange
        const string username = "usuario.valido";
        var usuario = new Usuario
        {
            IdPersona = 10,
            Username = username,
            Contrasenia = "hash_valido",
            IdPersonaNavigation = new Persona { IdPersona = 10, Activo = true }
        };

        _authRepoMock.Setup(r => r.GetByUsernameAsync(username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        _passwordHasherMock.Setup(p => p.VerifyPassword("password_equivocada", "hash_valido"))
            .Returns(false);

        var command = new LoginCommand(new LoginRequestDTO
        {
            Username = username,
            Password = "password_equivocada"
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("Usuario o contraseña incorrectos", result.Message);
    }

    [Fact]
    public async Task Login_ConUsuarioBloqueadoOInactivo_RetornaFalloBloqueado()
    {
        // Arrange
        const string username = "usuario.bloqueado";
        const string rawPassword = "PasswordCorrecta123";
        const string hashedPassword = "hash_valido";
        const int idPersona = 99;

        var usuario = new Usuario
        {
            IdPersona = idPersona,
            Username = username,
            Contrasenia = hashedPassword,
            IdPersonaNavigation = new Persona
            {
                IdPersona = idPersona,
                Activo = false // Cuenta / persona desactivada o bloqueada
            }
        };

        _authRepoMock.Setup(r => r.GetByUsernameAsync(username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        _passwordHasherMock.Setup(p => p.VerifyPassword(rawPassword, hashedPassword))
            .Returns(true);

        var command = new LoginCommand(new LoginRequestDTO
        {
            Username = username,
            Password = rawPassword
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("inactivo o bloqueado", result.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Null(result.Data);
    }

    [Fact]
    public async Task Login_ConUsuarioSinRoles_RetornaFalloSinRoles()
    {
        // Arrange
        const string username = "usuario.sin.rol";
        const string password = "Password123";
        const int idPersona = 15;

        var usuario = new Usuario
        {
            IdPersona = idPersona,
            Username = username,
            Contrasenia = "hash",
            IdPersonaNavigation = new Persona { IdPersona = idPersona, Activo = true }
        };

        _authRepoMock.Setup(r => r.GetByUsernameAsync(username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        _passwordHasherMock.Setup(p => p.VerifyPassword(password, "hash"))
            .Returns(true);

        _authRepoMock.Setup(r => r.GetRolesUsuarioAsync(idPersona, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RolUsuario>());

        var command = new LoginCommand(new LoginRequestDTO
        {
            Username = username,
            Password = password
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("no tiene roles asignados", result.Message, StringComparison.OrdinalIgnoreCase);
    }
}
