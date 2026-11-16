using AMMI_Online_API.API.Controllers.Common;
using AMMI_Online_API.API.Controllers.Payments;
using AMMI_Online_API.API.Controllers.Person;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Payments;
using AMMI_Online_API.Application.DTOs.Person;
using AMMI_Online_API.Application.Features.Adjuntos.Commands;
using AMMI_Online_API.Application.Features.Adjuntos.Queries;
using AMMI_Online_API.Application.Features.Payments.Queries;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Adjuntos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
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

    [Fact]
    public async Task PuedeEliminarAdjunto_PropietarioDocumentoNoAprobado_RetornaTrue()
    {
        // Arrange: documento propio con estado pendiente (null) o rechazado (false)
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.DocumentosPersonales.Add(new DocumentosPersonales
            {
                IdDocumentosPersonales = 1,
                IdAdjunto = 10,
                IdPersona = 20,
                CodigoRequisito = "CEDULA",
                Estado = null
            });
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Act
            var result = await service.PuedeEliminarAdjuntoAsync(10, 20, new[] { "Estudiante" });

            // Assert
            Assert.True(result);
        }
    }

    [Fact]
    public async Task PuedeEliminarAdjunto_PropietarioDocumentoAprobado_RetornaFalse()
    {
        // Arrange: documento propio ya aprobado (Estado = true) no puede ser eliminado por estudiante
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.DocumentosPersonales.Add(new DocumentosPersonales
            {
                IdDocumentosPersonales = 1,
                IdAdjunto = 10,
                IdPersona = 20,
                CodigoRequisito = "CEDULA",
                Estado = true
            });
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Act
            var result = await service.PuedeEliminarAdjuntoAsync(10, 20, new[] { "Estudiante" });

            // Assert: no puede modificar registro asociado aprobado
            Assert.False(result);
        }
    }

    [Fact]
    public async Task PuedeEliminarAdjunto_DocenteNoPuedeEliminarAdjuntoEstudiante_RetornaFalse()
    {
        // Arrange: Docente no posee rol de eliminación administrativa
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.DocumentosPersonales.Add(new DocumentosPersonales
            {
                IdDocumentosPersonales = 1,
                IdAdjunto = 10,
                IdPersona = 20,
                CodigoRequisito = "CEDULA",
                Estado = null
            });
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Act
            var result = await service.PuedeEliminarAdjuntoAsync(10, 99, new[] { "Docente" });

            // Assert
            Assert.False(result);
        }
    }

    [Theory]
    [InlineData("Administrador")]
    [InlineData("SuperAdmin")]
    [InlineData("Personal")]
    public async Task PuedeEliminarAdjunto_RolEliminacion_RetornaTrue(string rol)
    {
        // Arrange
        using var context = CreateInMemoryContext(Guid.NewGuid().ToString());
        var service = new AdjuntosAuthorizationService(context);

        // Act
        var result = await service.PuedeEliminarAdjuntoAsync(10, 99, new[] { rol });

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task PuedeEliminarAdjunto_ComprobantePagoEstudiante_RetornaFalse()
    {
        // Arrange: comprobante de pago no puede ser borrado libremente por estudiante
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.Pago.Add(new Pago
            {
                IdPago = 1,
                UrlComprobante = 15,
                UsuarioRegistro = 20,
                IdTipoPago = 1,
                IdCuentaBancaria = 1,
                NumeroDeposito = "DEP99",
                ValorPago = 100m,
                IdEstadoPago = 1
            });
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Act
            var result = await service.PuedeEliminarAdjuntoAsync(15, 20, new[] { "Estudiante" });

            // Assert
            Assert.False(result);
        }
    }

    [Fact]
    public async Task PuedeEliminarAdjunto_DiscapacidadPropietario_RetornaTrue_AjenoRetornaFalse()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.PersonaDiscapacidad.Add(new PersonaDiscapacidad
            {
                IdPersonaDiscapacidad = 1,
                IdPersona = 20,
                IdAdjunto = 30,
                IdTipoDiscapacidad = 1,
                Porcentaje = 40,
                Recomendaciones = "Ninguna"
            });
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Act
            var resultPropio = await service.PuedeEliminarAdjuntoAsync(30, 20, new[] { "Estudiante" });
            var resultAjeno = await service.PuedeEliminarAdjuntoAsync(30, 99, new[] { "Estudiante" });

            // Assert
            Assert.True(resultPropio);
            Assert.False(resultAjeno);
        }
    }

    [Fact]
    public async Task PuedeModificarDocumentoPersonal_ValidacionesPropiedadYEstado()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.DocumentosPersonales.AddRange(
                new DocumentosPersonales { IdDocumentosPersonales = 1, IdPersona = 20, CodigoRequisito = "R1", Estado = null },
                new DocumentosPersonales { IdDocumentosPersonales = 2, IdPersona = 20, CodigoRequisito = "R2", Estado = true }
            );
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Act & Assert
            // Propio y pendiente: permitido
            Assert.True(await service.PuedeModificarDocumentoPersonalAsync(1, 20, new[] { "Estudiante" }));
            // Propio pero aprobado: denegado
            Assert.False(await service.PuedeModificarDocumentoPersonalAsync(2, 20, new[] { "Estudiante" }));
            // Ajeno: denegado
            Assert.False(await service.PuedeModificarDocumentoPersonalAsync(1, 99, new[] { "Estudiante" }));
            // Administrador sobre aprobado: permitido
            Assert.True(await service.PuedeModificarDocumentoPersonalAsync(2, 99, new[] { "Administrador" }));
        }
    }

    [Fact]
    public async Task PuedeConsultarPagosPorDocumentoYMatricula_Validaciones()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        using (var context = CreateInMemoryContext(dbName))
        {
            context.Persona.Add(new Persona
            {
                IdPersona = 20,
                Documento = "1720000001",
                PrimerNombre = "Test",
                PrimerApellido = "User"
            });
            context.Matricula.Add(new Matricula
            {
                IdMatricula = 5,
                IdUsuarioAlumno = 20,
                IdMallaParalelo = 1,
                IdEstadoMatricula = 1
            });
            await context.SaveChangesAsync();
        }

        using (var context = CreateInMemoryContext(dbName))
        {
            var service = new AdjuntosAuthorizationService(context);

            // Pagos por documento
            Assert.True(await service.PuedeConsultarPagosPorDocumentoAsync("1720000001", 20, new[] { "Estudiante" }));
            Assert.False(await service.PuedeConsultarPagosPorDocumentoAsync("1720000001", 99, new[] { "Estudiante" }));
            Assert.True(await service.PuedeConsultarPagosPorDocumentoAsync("1720000001", 99, new[] { "Administrador" }));

            // Pagos por matricula
            Assert.True(await service.PuedeConsultarPagosPorMatriculaAsync(5, 20, new[] { "Estudiante" }));
            Assert.False(await service.PuedeConsultarPagosPorMatriculaAsync(5, 99, new[] { "Estudiante" }));
            Assert.True(await service.PuedeConsultarPagosPorMatriculaAsync(5, 99, new[] { "MASTER-CONTABILIDAD" }));
        }
    }

    [Fact]
    public async Task AdjuntosController_Delete_CuandoEstaAutorizado_RetornaOk()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeEliminarAdjuntoAsync(
                55,
                77,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        mediatorMock.Setup(m => m.Send(new DeleteAdjuntoCommand(55), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Response<bool>.Success(true, "Eliminado exitosamente"));

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
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task AdjuntosController_Delete_CuandoAutorizadoPeroNoExiste_RetornaNotFound()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeEliminarAdjuntoAsync(
                55,
                77,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        mediatorMock.Setup(m => m.Send(new DeleteAdjuntoCommand(55), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Response<bool>.Failure("No se pudo eliminar el adjunto o no existe"));

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
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task FotoPerfilController_DeleteFoto_CuandoAccesoEsAjeno_RetornaForbid403()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeEliminarFotoPerfilAsync(
                10,
                77,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(sp => sp.GetService(typeof(IAdjuntosAuthorizationService)))
            .Returns(authServiceMock.Object);
        serviceProviderMock.Setup(sp => sp.GetService(typeof(IMediator)))
            .Returns(mediatorMock.Object);

        var controller = new FotoPerfilController();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                RequestServices = serviceProviderMock.Object,
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "77"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.DeleteFoto(10, CancellationToken.None);

        // Assert
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public void FotoPerfilController_EndpointsAdmin_RequierenRolesAutorizados()
    {
        var methodDoc = typeof(FotoPerfilController).GetMethod(nameof(FotoPerfilController.DeleteFotoAdminByDocumento));
        var authAttrDoc = methodDoc?.GetCustomAttributes(typeof(AuthorizeAttribute), false).FirstOrDefault() as AuthorizeAttribute;
        Assert.NotNull(authAttrDoc);
        Assert.Equal("Administrador,SuperAdmin,Personal", authAttrDoc?.Roles);

        var methodPersona = typeof(FotoPerfilController).GetMethod(nameof(FotoPerfilController.DeleteFotoAdminByPersonaId));
        var authAttrPersona = methodPersona?.GetCustomAttributes(typeof(AuthorizeAttribute), false).FirstOrDefault() as AuthorizeAttribute;
        Assert.NotNull(authAttrPersona);
        Assert.Equal("Administrador,SuperAdmin,Personal", authAttrPersona?.Roles);
    }

    [Fact]
    public async Task DocumentosPersonalesController_Delete_CuandoAccesoEsAjeno_RetornaForbid403()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeEliminarDocumentoPersonalAsync(
                15,
                77,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(sp => sp.GetService(typeof(IAdjuntosAuthorizationService)))
            .Returns(authServiceMock.Object);
        serviceProviderMock.Setup(sp => sp.GetService(typeof(IMediator)))
            .Returns(mediatorMock.Object);

        var controller = new DocumentosPersonalesController();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                RequestServices = serviceProviderMock.Object,
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "77"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.DeleteDocumentosPersonales(new DeleteDocumentosPersonalesCommand(15), CancellationToken.None);

        // Assert
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task PersonaDiscapacidadController_Delete_CuandoAccesoEsAjeno_RetornaForbid403()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeEliminarDiscapacidadAsync(
                22,
                77,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(sp => sp.GetService(typeof(IAdjuntosAuthorizationService)))
            .Returns(authServiceMock.Object);
        serviceProviderMock.Setup(sp => sp.GetService(typeof(IMediator)))
            .Returns(mediatorMock.Object);

        var controller = new PersonaDiscapacidadController();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                RequestServices = serviceProviderMock.Object,
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "77"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.DeletePersonaDiscapacidad(new DeletePersonaDiscapacidadCommand(22), CancellationToken.None);

        // Assert
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task PagosController_GetPagosByDocumento_CuandoAccesoEsAjeno_RetornaForbid403()
    {
        // Arrange
        var mediatorMock = new Mock<IMediator>();
        var authServiceMock = new Mock<IAdjuntosAuthorizationService>();

        authServiceMock.Setup(s => s.PuedeConsultarPagosPorDocumentoAsync(
                "1720000001",
                77,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(sp => sp.GetService(typeof(IAdjuntosAuthorizationService)))
            .Returns(authServiceMock.Object);
        serviceProviderMock.Setup(sp => sp.GetService(typeof(IMediator)))
            .Returns(mediatorMock.Object);

        var controller = new PagosController();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                RequestServices = serviceProviderMock.Object,
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim("idPersona", "77"),
                    new Claim(ClaimTypes.Role, "Estudiante")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.GetPagosByDocumento("1720000001", CancellationToken.None);

        // Assert
        Assert.IsType<ForbidResult>(result);
    }
}
