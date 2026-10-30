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
    /// documentado en docs/endpoints-publicos.md y añadido explícitamente a esta lista
    /// para evitar fugas de seguridad o exposición inadvertida de datos.
    /// </summary>
    public static readonly HashSet<string> WhitelistedAnonymousEndpoints = new(StringComparer.OrdinalIgnoreCase)
    {
        // Autenticación pública y registro inicial
        "AuthController.Login",
        "AuthController.Register",

        // Verificación de correo pública para registro y postulación
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
        "EstadoCivilController.GetAllEstadoCivil",
        "EtniaController.GetAllEtnias",
        "GeneroController.GetAllGenero",
        "NacionalidadEtnicaController.GetAllNacionalidadEtnica",
        "PaisController.GetAllPais",
        "ParroquiaController.GetAllParroquia",
        "ProvinciaController.GetAllProvincia",
        "ProvinciaController.GetProvinciasByPais",
        "RequisitosController.GetByMalla",
        "TipoDatoContactoController.GetAllTipoDatoContacto",
        "TipoDocumentoController.GetAllTipoDocumento",
        "TipoOfertaController.GetAllTipoOferta",

        // Oferta académica pública y consulta de mallas curriculares activas para postulantes
        "MallaController.GetAll",
        "MallaController.GetMallaByTipoOferta",

        // Formulario de inscripción y postulación pública externa
        "PersonaPostulacion.CrearPostulacion"
    };

    private static readonly Assembly ApiAssembly = typeof(AuthController).Assembly;

    private static List<string> ObtenerEndpointsAnonimosDelEnsamblado()
    {
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

        return anonymousEndpointsEncontrados;
    }

    [Fact]
    public void EndpointPolicy_SolamenteEndpointsEnListaBlancaTienenAccesoAnonimo()
    {
        // Arrange
        var anonymousEndpointsEncontrados = ObtenerEndpointsAnonimosDelEnsamblado();

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

    [Fact]
    public void EndpointPolicy_ListaBlanca_NoDebeContenerEndpointsInexistentesOProtegidos()
    {
        // Arrange
        var anonymousEndpointsEncontrados = new HashSet<string>(ObtenerEndpointsAnonimosDelEnsamblado(), StringComparer.OrdinalIgnoreCase);

        // Act: Encontrar elementos en la lista blanca que ya no son anónimos en el código
        var elementosObsoletos = WhitelistedAnonymousEndpoints
            .Where(w => !anonymousEndpointsEncontrados.Contains(w))
            .ToList();

        // Assert: La lista blanca no debe tener endpoints obsoletos o ya protegidos
        Assert.True(
            elementosObsoletos.Count == 0,
            $"La lista blanca contiene endpoints que ya están protegidos o no son anónimos:\n" +
            $"{string.Join("\n", elementosObsoletos)}\n" +
            "Elimine estos endpoints de WhitelistedAnonymousEndpoints para mantener la lista exacta y limpia.");
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
    [InlineData("DistributivoController")]
    [InlineData("MallaCompletaController")]
    [InlineData("MallaRequisitosController")]
    [InlineData("MatriculaController")]
    [InlineData("PeriodoLectivoController")]
    [InlineData("RegimenController")]
    [InlineData("MateriaController")]
    [InlineData("EspecialidadController")]
    [InlineData("TipoDiscapacidadController")]
    [InlineData("EstadoMatriculaController")]
    [InlineData("PlantillaEstructuraController")]
    [InlineData("PlantillaEvaluacionController")]
    [InlineData("ReglasCalculoController")]
    [InlineData("TipoPlantillaEstructuraController")]
    [InlineData("TipoReglaCalculoController")]
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
