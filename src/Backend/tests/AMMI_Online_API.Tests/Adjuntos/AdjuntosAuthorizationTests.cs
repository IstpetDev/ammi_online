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
}
