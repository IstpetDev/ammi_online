using AMMI_Online_API.Application.DTOs.Segurity;
using AMMI_Online_API.Application.Features.Segurity.Commands;
using AMMI_Online_API.Application.Features.Segurity.Handlers;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using Moq;
using Xunit;

namespace AMMI_Online_API.Tests.Auth;

public class RecuperarClaveValidacionCommandHandlerTests
{
    private readonly Mock<IAuthRepository> _authRepoMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly RecuperarClaveValidacionCommandHandler _handler;

    public RecuperarClaveValidacionCommandHandlerTests()
    {
        _authRepoMock = new Mock<IAuthRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();

        _handler = new RecuperarClaveValidacionCommandHandler(
            _authRepoMock.Object,
            _passwordHasherMock.Object);
    }

    [Fact]
    public async Task RecuperarClave_ConDatosCorrectos_RetornaClaveTemporalYFuerzaCambio()
    {
        // Arrange
        const string documento = "1720304050";
        var fechaNac = new DateOnly(1995, 6, 15);
        const int idPersona = 101;
        const string username = "estudiante.test";

        var usuario = new Usuario
        {
            IdPersona = idPersona,
            Username = username,
            Contrasenia = "hash_antiguo",
            RequiereCambioContrasenia = false,
            IdPersonaNavigation = new Persona
            {
                IdPersona = idPersona,
                Documento = documento,
                Activo = true,
                PersonaInfo = new PersonaInfo
                {
                    IdPersona = idPersona,
                    FechaNacimiento = fechaNac
                }
            }
        };

        _authRepoMock.Setup(r => r.GetByDocumentoWithPersonaInfoAsync(documento, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        _passwordHasherMock.Setup(p => p.HashPassword(It.IsAny<string>()))
            .Returns("nuevo_hash_seguro");

        _authRepoMock.Setup(r => r.UpdatePasswordAsync(idPersona, "nuevo_hash_seguro", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _authRepoMock.Setup(r => r.SetRequiereCambioContraseniaAsync(idPersona, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _authRepoMock.Setup(r => r.ClearResetTokenAsync(idPersona, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var command = new RecuperarClaveValidacionCommand(new RecuperarClaveValidacionRequestDTO
        {
            Documento = documento,
            FechaNacimiento = fechaNac
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(username, result.Data.Username);
        Assert.False(string.IsNullOrWhiteSpace(result.Data.ClaveTemporal));
        Assert.True(result.Data.ClaveTemporal.Length >= 8);

        _authRepoMock.Verify(r => r.UpdatePasswordAsync(idPersona, "nuevo_hash_seguro", It.IsAny<CancellationToken>()), Times.Once);
        _authRepoMock.Verify(r => r.SetRequiereCambioContraseniaAsync(idPersona, true, It.IsAny<CancellationToken>()), Times.Once);
        _authRepoMock.Verify(r => r.ClearResetTokenAsync(idPersona, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RecuperarClave_ConDocumentoVacio_RetornaFallo()
    {
        // Arrange
        var command = new RecuperarClaveValidacionCommand(new RecuperarClaveValidacionRequestDTO
        {
            Documento = "   ",
            FechaNacimiento = new DateOnly(2000, 1, 1)
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("documento es requerido", result.Message, StringComparison.OrdinalIgnoreCase);
        _authRepoMock.Verify(r => r.GetByDocumentoWithPersonaInfoAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecuperarClave_UsuarioNoExiste_RetornaFallo()
    {
        // Arrange
        const string documento = "0000000000";
        _authRepoMock.Setup(r => r.GetByDocumentoWithPersonaInfoAsync(documento, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Usuario?)null);

        var command = new RecuperarClaveValidacionCommand(new RecuperarClaveValidacionRequestDTO
        {
            Documento = documento,
            FechaNacimiento = new DateOnly(2000, 1, 1)
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("no coinciden", result.Message, StringComparison.OrdinalIgnoreCase);
        _authRepoMock.Verify(r => r.UpdatePasswordAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecuperarClave_UsuarioInactivo_RetornaFallo()
    {
        // Arrange
        const string documento = "1720304050";
        var usuario = new Usuario
        {
            IdPersona = 50,
            Username = "usuario.inactivo",
            IdPersonaNavigation = new Persona
            {
                IdPersona = 50,
                Documento = documento,
                Activo = false
            }
        };

        _authRepoMock.Setup(r => r.GetByDocumentoWithPersonaInfoAsync(documento, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        var command = new RecuperarClaveValidacionCommand(new RecuperarClaveValidacionRequestDTO
        {
            Documento = documento,
            FechaNacimiento = new DateOnly(1990, 1, 1)
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("inactivo o bloqueado", result.Message, StringComparison.OrdinalIgnoreCase);
        _authRepoMock.Verify(r => r.UpdatePasswordAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecuperarClave_SinFechaNacimientoEnBD_RetornaFalloInformativo()
    {
        // Arrange
        const string documento = "1720304050";
        var usuario = new Usuario
        {
            IdPersona = 50,
            Username = "usuario.sin.fecha",
            IdPersonaNavigation = new Persona
            {
                IdPersona = 50,
                Documento = documento,
                Activo = true,
                PersonaInfo = new PersonaInfo
                {
                    IdPersona = 50,
                    FechaNacimiento = null
                }
            }
        };

        _authRepoMock.Setup(r => r.GetByDocumentoWithPersonaInfoAsync(documento, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        var command = new RecuperarClaveValidacionCommand(new RecuperarClaveValidacionRequestDTO
        {
            Documento = documento,
            FechaNacimiento = new DateOnly(1990, 1, 1)
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("no tiene registrada una fecha de nacimiento", result.Message, StringComparison.OrdinalIgnoreCase);
        _authRepoMock.Verify(r => r.UpdatePasswordAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecuperarClave_FechaNacimientoNoCoincide_RetornaFallo()
    {
        // Arrange
        const string documento = "1720304050";
        var usuario = new Usuario
        {
            IdPersona = 50,
            Username = "usuario.valido",
            IdPersonaNavigation = new Persona
            {
                IdPersona = 50,
                Documento = documento,
                Activo = true,
                PersonaInfo = new PersonaInfo
                {
                    IdPersona = 50,
                    FechaNacimiento = new DateOnly(1990, 1, 1)
                }
            }
        };

        _authRepoMock.Setup(r => r.GetByDocumentoWithPersonaInfoAsync(documento, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        var command = new RecuperarClaveValidacionCommand(new RecuperarClaveValidacionRequestDTO
        {
            Documento = documento,
            FechaNacimiento = new DateOnly(1999, 12, 31) // Fecha incorrecta
        });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("no coincide", result.Message, StringComparison.OrdinalIgnoreCase);
        _authRepoMock.Verify(r => r.UpdatePasswordAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
