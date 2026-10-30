using AMMI_Online_API.API.Controllers.Common;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Adjuntos.Commands;
using AMMI_Online_API.Application.Features.Adjuntos.Queries;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Adjuntos;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;

namespace AMMI_Online_API.Tests.Adjuntos;

public class AdjuntosAuthorizationTests
{
    private static Ammi_OnlineContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<Ammi_OnlineContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new Ammi_OnlineContext(options);
    }

    [Theory]
    [InlineData("Administrador")]
    [InlineData("SuperAdmin")]
    [InlineData("Personal")]
    [InlineData("Docente")]
    public async Task PuedeAccederAdjunto_RolPrivilegiado_RetornaTrue(string rol)
    {
        // Arrange
        using var context = CreateInMemoryContext(Guid.NewGuid().ToString());
        var service = new AdjuntosAuthorizationService(context);

        // Act
        var result = await service.PuedeAccederAdjuntoAsync(
            idAdjunto: 999,
            idPersona: 10,
            roles: new[] { rol });

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task PuedeAccederAdjunto_PropietarioDocumentoPersonal_RetornaTrue()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.Adjunto.Add(new Domain.Entities.Adjunto { IdAdjunto = 5, Path = "Uploads/doc.pdf" });
            context.DocumentosPersonales.Add(new DocumentosPersonales
            {
                IdDocumentosPersonales = 1,
                IdAdjunto = 5,
                IdPersona = 20,
                CodigoRequisito = "CEDULA"
            });
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Act
            var result = await service.PuedeAccederAdjuntoAsync(
                idAdjunto: 5,
                idPersona: 20,
                roles: new[] { "Estudiante" });

            // Assert
            Assert.True(result);
        }
    }

    [Fact]
    public async Task PuedeAccederAdjunto_PropietarioPago_RetornaTrue()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.Adjunto.Add(new Domain.Entities.Adjunto { IdAdjunto = 8, Path = "Uploads/pago.pdf" });
            context.Pago.Add(new Pago
            {
                IdPago = 1,
                UrlComprobante = 8,
                UsuarioRegistro = 33,
                IdTipoPago = 1,
                IdCuentaBancaria = 1,
                NumeroDeposito = "DEP123",
                ValorPago = 50.0m
            });
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Act
            var result = await service.PuedeAccederAdjuntoAsync(
                idAdjunto: 8,
                idPersona: 33,
                roles: new[] { "Estudiante" });

            // Assert
            Assert.True(result);
        }
    }

    [Fact]
    public async Task PuedeAccederAdjunto_UsuarioAjeno_RetornaFalse_AccesoDenegado()
    {
        // Arrange: el adjunto pertenece a la persona 50, pero quien consulta es la persona 99
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.Adjunto.Add(new Domain.Entities.Adjunto { IdAdjunto = 12, Path = "Uploads/privado.pdf" });
            context.DocumentosPersonales.Add(new DocumentosPersonales
            {
                IdDocumentosPersonales = 1,
                IdAdjunto = 12,
                IdPersona = 50,
                CodigoRequisito = "TITULO"
            });
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Act: persona ajena (idPersona = 99) sin rol administrativo
            var result = await service.PuedeAccederAdjuntoAsync(
                idAdjunto: 12,
                idPersona: 99,
                roles: new[] { "Estudiante" });

            // Assert: ajeno denegado
            Assert.False(result);
        }
    }

    [Fact]
    public async Task PuedeAccederAdjunto_UsuarioAnonimoOInvalido_RetornaFalse()
    {
        // Arrange
        using var context = CreateInMemoryContext(Guid.NewGuid().ToString());
        var service = new AdjuntosAuthorizationService(context);

        // Act
        var result = await service.PuedeAccederAdjuntoAsync(
            idAdjunto: 1,
            idPersona: 0,
            roles: Array.Empty<string>());

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task AdjuntosController_GetById_CuandoAccesoEsAjeno_RetornaForbid403()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeAccederAdjuntoAsync(
                It.Is<int>(id => id == 100),
                It.IsAny<int>(),
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false); // Ajeno denegado

        var controller = new AdjuntosController(mediatorMock.Object, authServiceMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "77"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.GetById(100);

        // Assert: 403 Forbid
        Assert.IsType<ForbidResult>(result);
        mediatorMock.Verify(m => m.Send(It.IsAny<GetAdjuntoByIdQuery>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AdjuntosController_GetById_CuandoEsPropietarioOAutorizado_RetornaFileResult()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeAccederAdjuntoAsync(
                100,
                77,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true); // Autorizado

        var fakeContent = new byte[] { 0x25, 0x50, 0x44, 0x46 };
        var dto = new AdjuntoDownloadDTO
        {
            Content = fakeContent,
            ContentType = "application/pdf",
            FileName = "comprobante.pdf"
        };

        mediatorMock.Setup(m => m.Send(new GetAdjuntoByIdQuery(100), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Response<AdjuntoDownloadDTO>.Success(dto, "OK"));

        var controller = new AdjuntosController(mediatorMock.Object, authServiceMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "77"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.GetById(100);

        // Assert
        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/pdf", fileResult.ContentType);
        Assert.Equal("comprobante.pdf", fileResult.FileDownloadName);
        Assert.Equal(fakeContent, fileResult.FileContents);

        // Verificación de encabezados de seguridad en la descarga (Issue #23)
        Assert.Equal("nosniff", controller.Response.Headers["X-Content-Type-Options"].ToString());
        Assert.Contains("attachment", controller.Response.Headers["Content-Disposition"].ToString());
    }

    [Fact]
    public async Task AdjuntosController_Delete_CuandoAccesoEsAjeno_RetornaForbid403()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeEliminarAdjuntoAsync(
                55,
                77,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false); // Ajeno denegado

        var controller = new AdjuntosController(mediatorMock.Object, authServiceMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "77"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.Delete(55);

        // Assert
        Assert.IsType<ForbidResult>(result);
        mediatorMock.Verify(m => m.Send(It.IsAny<DeleteAdjuntoCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }
    [Fact]
    public void AdjuntosController_TieneAtributoAuthorize_ProtegiendoContraAccesoAnonimo401()
    {
        // Assert: El controlador completo debe exigir sesión con [Authorize]
        var controllerType = typeof(AdjuntosController);
        var authAttr = controllerType.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), inherit: true);
        Assert.NotEmpty(authAttr);
    }

    [Fact]
    public async Task AdjuntosController_GetById_UsuarioANoAccedeAArchivoDeUsuarioB_RetornaForbid403()
    {
        // Arrange: Usuario A (idPersona = 10) intenta acceder al adjunto 999 perteneciente a Usuario B
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeAccederAdjuntoAsync(
                999,
                10,
                It.Is<IEnumerable<string>>(roles => roles.Contains("Estudiante")),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false); // Usuario A no tiene permiso sobre el archivo de Usuario B

        var controller = new AdjuntosController(mediatorMock.Object, authServiceMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "10"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.GetById(999);

        // Assert: 403 Forbidden
        Assert.IsType<ForbidResult>(result);
        mediatorMock.Verify(m => m.Send(It.IsAny<GetAdjuntoByIdQuery>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task AdjuntosController_GetByPath_RutaInvalida_RetornaBadRequest(string? invalidPath)
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();
        var controller = new AdjuntosController(mediatorMock.Object, authServiceMock.Object);

        // Act
        var result = await controller.GetByPath(invalidPath!);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task AdjuntosController_GetByPath_ArchivoNoExisteEnBD_RetornaNotFound()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();
        var adjuntosRepoMock = new Mock<AMMI_Online_API.Domain.Interfaces.Adjuntos.IAdjuntos>();

        adjuntosRepoMock.Setup(r => r.GetByPathAsync("Uploads/inexistente.pdf", It.IsAny<CancellationToken>()))
            .ReturnsAsync((AMMI_Online_API.Domain.Entities.Adjunto?)null);

        var controller = new AdjuntosController(mediatorMock.Object, authServiceMock.Object, adjuntosRepoMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "10"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.GetByPath("Uploads/inexistente.pdf");

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task AdjuntosController_GetByPath_CuandoAccesoEsAjeno_RetornaForbid403()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();
        var adjuntosRepoMock = new Mock<AMMI_Online_API.Domain.Interfaces.Adjuntos.IAdjuntos>();

        var fakeAdjunto = new AMMI_Online_API.Domain.Entities.Adjunto { IdAdjunto = 42, Path = "Uploads/privado.pdf" };
        adjuntosRepoMock.Setup(r => r.GetByPathAsync("Uploads/privado.pdf", It.IsAny<CancellationToken>()))
            .ReturnsAsync(fakeAdjunto);

        authServiceMock.Setup(s => s.PuedeAccederAdjuntoAsync(
                42,
                10,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false); // Acceso denegado

        var controller = new AdjuntosController(mediatorMock.Object, authServiceMock.Object, adjuntosRepoMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "10"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.GetByPath("Uploads/privado.pdf");

        // Assert: 403 Forbidden
        Assert.IsType<ForbidResult>(result);
        mediatorMock.Verify(m => m.Send(It.IsAny<GetAdjuntoByIdQuery>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AdjuntosController_GetByPath_CuandoEsAutorizado_RetornaFileResultConHeaders()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();
        var adjuntosRepoMock = new Mock<AMMI_Online_API.Domain.Interfaces.Adjuntos.IAdjuntos>();

        var fakeAdjunto = new AMMI_Online_API.Domain.Entities.Adjunto { IdAdjunto = 42, Path = "Uploads/mi_comprobante.pdf" };
        adjuntosRepoMock.Setup(r => r.GetByPathAsync("Uploads/mi_comprobante.pdf", It.IsAny<CancellationToken>()))
            .ReturnsAsync(fakeAdjunto);

        authServiceMock.Setup(s => s.PuedeAccederAdjuntoAsync(
                42,
                10,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true); // Autorizado

        var fakeContent = new byte[] { 0x25, 0x50, 0x44, 0x46 };
        var dto = new AdjuntoDownloadDTO
        {
            Content = fakeContent,
            ContentType = "application/pdf",
            FileName = "mi_comprobante.pdf"
        };

        mediatorMock.Setup(m => m.Send(new GetAdjuntoByIdQuery(42), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Response<AdjuntoDownloadDTO>.Success(dto, "OK"));

        var controller = new AdjuntosController(mediatorMock.Object, authServiceMock.Object, adjuntosRepoMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "10"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.GetByPath("Uploads/mi_comprobante.pdf");

        // Assert
        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/pdf", fileResult.ContentType);
        Assert.Equal("mi_comprobante.pdf", fileResult.FileDownloadName);
        Assert.Equal("nosniff", controller.Response.Headers["X-Content-Type-Options"].ToString());
        Assert.Contains("attachment", controller.Response.Headers["Content-Disposition"].ToString());
    }

}
