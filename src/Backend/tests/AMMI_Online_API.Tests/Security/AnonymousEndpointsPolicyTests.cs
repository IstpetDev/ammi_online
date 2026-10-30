using System.Reflection;
using AMMI_Online_API.API.Controllers.Common;
using AMMI_Online_API.API.Controllers.Segurity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace AMMI_Online_API.Tests.Security;

public class AnonymousEndpointsPolicyTests
{
    /// <summary>
    /// Lista blanca oficial de endpoints anónimos permitidos en la API pública.
    /// Cualquier endpoint nuevo que requiera [AllowAnonymous] debe ser justificado,
    /// documentado y añadido explícitamente a esta lista para evitar fugas de seguridad.
    /// </summary>
    public static readonly HashSet<string> WhitelistedAnonymousEndpoints = new(StringComparer.OrdinalIgnoreCase)
    {
        // Autenticación pública y registro inicial
        "AuthController.Login",
        "AuthController.Register",

        // Verificación de correo pública para registro
        "EmailVerificationController.SendOtp",
        "EmailVerificationController.VerifyEmailToken",
        "EmailVerificationController.VerifyOtp",
        "EmailVerificationController.ResendOtp",
        "EmailVerificationController.CheckEmailVerified",

        // Asistente virtual / ChatBot público
        "ChatBotController.GetInformacionActiva",

        // Catálogos públicos requeridos para formularios de inscripción y postulación
        "CantonController.GetAllCanton",
        "CicloController.GetCiclo",
        "CursosController.GetCursos",
        "EspecialidadController.GetEspecialidad",
        "EstadoCivilController.GetAllEstadoCivil",
        "EtniaController.GetAllEtnias",
        "GeneroController.GetAllGenero",
        "MateriaController.GetMaterias",
        "NacionalidadEtnicaController.GetAllNacionalidadEtnica",
        "PaisController.GetAllPais",
        "ParroquiaController.GetAllParroquia",
        "PeriodoLectivoController.GetPeriodosLectivos",
        "ProvinciaController.GetAllProvincia",
        "ProvinciaController.GetProvinciasByPais",
        "RegimenController.GetRegimenes",
        "TipoDatoContactoController.GetAllTipoDatoContacto",
        "TipoDiscapacidadController.GetAllTipoDiscapacidad",
        "TipoDocumentoController.GetAllTipoDocumento",
        "TipoOfertaController.GetAllTipoOferta",

        // Oferta académica pública y consulta de mallas curriculares
        "DistributivoController.GetByCicloAgrupado",
        "MallaCompletaController.Crear",
        "MallaCompletaController.Duplicar",
        "MallaCompletaController.ClonarParaCiclo",
        "MallaCompletaController.GetConfiguracionCursos",
        "MallaController.GetAll",
        "MallaController.GetById",
        "MallaController.GetByCiclo",
        "MallaController.GetMallaByTipoOferta",
        "MallaRequisitosController.GetAll",

        // Inscripciones / Postulaciones públicas
        "MatriculaController.CambiarParalelo",
        "PersonaPostulacion.CrearPostulacion",
        "PersonaPostulacion.CrearPostulacionManual",
        "PersonaPostulacion.ActualizarPostulacionContacto"
    };

    private static readonly Assembly ApiAssembly = typeof(AuthController).Assembly;

    [Fact]
    public void EndpointPolicy_SolamenteEndpointsEnListaBlancaTienenAccesoAnonimo()
    {
        // Arrange: Inspeccionar todos los controladores en el ensamblado de la API
        var controllers = ApiAssembly.GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract)
            .ToList();

        var anonymousEndpointsEncontrados = new List<string>();

        foreach (var controller in controllers)
        {
            var controllerHasAllowAnonymous = controller.GetCustomAttribute<AllowAnonymousAttribute>() != null;

            var actionMethods = controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                .Where(m => !m.IsSpecialName);

            foreach (var action in actionMethods)
            {
                var actionHasAllowAnonymous = action.GetCustomAttribute<AllowAnonymousAttribute>() != null;
                var actionHasAuthorize = action.GetCustomAttribute<AuthorizeAttribute>() != null;

                if (actionHasAllowAnonymous || (controllerHasAllowAnonymous && !actionHasAuthorize))
                {
                    anonymousEndpointsEncontrados.Add($"{controller.Name}.{action.Name}");
                }
            }
        }

        // Act: Encontrar endpoints que tienen [AllowAnonymous] pero no están en la lista blanca
        var noAutorizados = anonymousEndpointsEncontrados
            .Where(e => !WhitelistedAnonymousEndpoints.Contains(e))
            .ToList();

        // Assert: Si aparece un endpoint anónimo inesperado, la prueba falla
        Assert.True(
            noAutorizados.Count == 0,
            $"Se encontraron endpoints anónimos NO permitidos ni documentados en la lista blanca:\n" +
            $"{string.Join("\n", noAutorizados)}\n" +
            "Todo endpoint público debe ser revisado y explícitamente añadido a WhitelistedAnonymousEndpoints.");
    }

    [Theory]
    [InlineData("AdjuntosController")]
    [InlineData("UsuarioController")]
    [InlineData("RolController")]
    [InlineData("RolOperacionController")]
    [InlineData("RolUsuarioController")]
    [InlineData("ModuloController")]
    [InlineData("ModuloOperacionController")]
    [InlineData("PagosController")]
    [InlineData("CreditoController")]
    [InlineData("ClienteController")]
    [InlineData("DevUtilsController")]
    public void EndpointPolicy_ControladoresSensibles_NoDebenTenerEndpointsAnonimos(string controllerName)
    {
        // Arrange
        var controllerType = ApiAssembly.GetTypes()
            .FirstOrDefault(t => t.Name.Equals(controllerName, StringComparison.OrdinalIgnoreCase));

        Assert.NotNull(controllerType);

        // Assert a nivel de clase
        var classHasAllowAnonymous = controllerType.GetCustomAttribute<AllowAnonymousAttribute>() != null;
        Assert.False(classHasAllowAnonymous, $"El controlador sensible '{controllerName}' tiene [AllowAnonymous] a nivel de clase.");

        // Assert a nivel de métodos / acciones
        var actions = controllerType.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
            .Where(m => !m.IsSpecialName)
            .ToList();

        foreach (var action in actions)
        {
            var actionHasAllowAnonymous = action.GetCustomAttribute<AllowAnonymousAttribute>() != null;
            Assert.False(
                actionHasAllowAnonymous,
                $"La acción '{controllerName}.{action.Name}' es sensible y NO debe tener [AllowAnonymous].");
        }
    }
}
