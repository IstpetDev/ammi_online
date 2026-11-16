using AMMI_Online_API.Domain.Interfaces;
using AMMI_Online_API.Domain.Interfaces.Adjuntos;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Notas;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Adjuntos;
using AMMI_Online_API.Domain.Interfaces.Infrastructure;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Infrastructure;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Catalogs;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Person;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Postulations;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Notas;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Distributive;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AMMI_Online_API.Infrastructure.Services;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Interfaces.Distributive;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Segurity;
using AMMI_Online_API.Infrastructure.Persistence;


using AMMI_Online_API.Infrastructure.Persistence.Interceptors;
using AMMI_Online_API.Infrastructure.Persistence.Jobs;
using AMMI_Online_API.Domain.Interfaces.ChatBot;
using AMMI_Online_API.Infrastructure.Persistence.Repositories.Services;

namespace AMMI_Online_API.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<Ammi_OnlineContext>(options =>
            options.UseMySql(
                configuration.GetConnectionString("DefaultConnection"),
                ServerVersion.AutoDetect(
                    configuration.GetConnectionString("DefaultConnection"))
            ).AddInterceptors(new AuditInterceptor()));

        services.AddScoped<IPersonaNacionalidad, PersonaNacionalidadRepository>();
        services.AddScoped<IPersonaInfo, PersonaInfoRepository>();
        services.AddScoped<IPersona, PersonaRepository>();
        services.AddScoped<IDocenteRepository, DocenteRepository>();
        services.AddScoped<IPersonaDiscapacidad, PersonaDiscapacidadRepository>();
        services.AddScoped<IPersonaDireccion, PersonaDireccionRepository>();
        services.AddScoped<IPersonaActividadEconomica, PersonaActividadEconomicaRepository>();
        services.AddScoped<IPersonaPostulacion, PersonaPostulacionRepository>();
        services.AddScoped<IParentesco, ParentescoRepository>();
        services.AddScoped<IDocumentosPersonales, DocumentosPersonalesRepository>();
        services.AddScoped<IFotoPerfilRepository, FotoPerfilRepository>();
        services.AddScoped<IDatosContacto, DatosContactoRepository>();

        //Catalogos
        services.AddScoped<IGeneroRepository, GeneroRepository>();
        services.AddScoped<ITipoParentescoRepository, TipoParentescoRepository>();
        services.AddScoped<ITipoDiscapacidadRepository, TipoDiscapacidadRepository>();
        services.AddScoped<IEstadoCivilRepository, EstadoCivilRepository>();
        services.AddScoped<IPaisRepository, PaisRepository>();
        services.AddScoped<IProvinciaRepository, ProvinciaRepository>();
        services.AddScoped<ICantonRepository, CantonRepository>();
        services.AddScoped<IParroquiaRepository, ParroquiaRepository>();
        services.AddScoped<ITipoDocumentoPersonalRepository, TipoDocumentoPersonalRepository>();
        services.AddScoped<ITipoDocumentoRepository, TipoDocumentoRepository>();
        services.AddScoped<ITipoDatoContactoRepository, TipoDatoContactoRepository>();
        services.AddScoped<INacionalidadEtnicaRepository, NacionalidadEtnicaRepository>();
        services.AddScoped<ICiclo, CicloRepository>();
        services.AddScoped<IEspecialidad, EspecialdiadRepository>();
        services.AddScoped<IInstitucion, InstitucionRepository>();
        services.AddScoped<ICurso, CursoRepository>();
        services.AddScoped<ICantonRepository, CantonRepository>();
        services.AddScoped<IEstadoCivilRepository, EstadoCivilRepository>();
        services.AddScoped<IMateria, MateriaRepository>();
        services.AddScoped<INacionalidadEtnicaRepository, NacionalidadEtnicaRepository>();
        services.AddScoped<IPaisRepository, PaisRepository>();
        services.AddScoped<IProvinciaRepository, ProvinciaRepository>();
        services.AddScoped<IParalelo, ParaleloRepository>();
        services.AddScoped<IPeriodoLectivo, PeriodoLectivoRepository>();
        services.AddScoped<IRegimen, RegimenRepository>();
        services.AddScoped<ITipoDatoContactoRepository, TipoDatoContactoRepository>();
        services.AddScoped<ITipoDiscapacidadRepository, TipoDiscapacidadRepository>();
        services.AddScoped<ITipoDocumentoPersonalRepository, TipoDocumentoPersonalRepository>();
        services.AddScoped<ITipoDocumentoRepository, TipoDocumentoRepository>();
        services.AddScoped<ITipoParentescoRepository, TipoParentescoRepository>();
        services.AddScoped<IEtniaRepository, EtniaRepository>();
        services.AddScoped<ITipoPlantillaEstructuraRepository, TipoPlantillaEstructuraRepository>();
        services.AddScoped<ITipoReglaCalculoRepository, TipoReglaCalculoRepository>();
        services.AddScoped<ITipoOfertaRepository, TipoOfertaRepository>();
        services.AddScoped<IEspecieRepository, EspecieRepository>();
        services.AddScoped<ITipoPagoRepository, TipoPagoRepository>();
        services.AddScoped<ITipoEstadoAprobacionRepository, TipoEstadoAprobacionRepository>();
        services.AddScoped<ITipoActividadEconomicaRepository, TipoActividadEconomicaRepository>();
        services.AddScoped<IRequisitosRepository, RequisitosRepository>();
        services.AddScoped<IMallaRepository, MallaRepository>();
        services.AddScoped<IDetalleMallaRepository, DetalleMallaRepository>();
        services.AddScoped<IMallaRequisitosRepository, MallaRequisitosRepository>();
        services.AddScoped<IPlantillaEvaluacionRepository, PlantillaEvaluacionRepository>();
        services.AddScoped<IPlantillaEstructuraRepository, PlantillaEstructuraRepository>();
        services.AddScoped<IArea, AreaRepository>();
        services.AddScoped<IAreaCompetencia, AreaCompetenciaRepository>();
        services.AddScoped<IEstadoPagoRepository, EstadoPagoRepository>();
        services.AddScoped<IEstadoMatriculaRepository, EstadoMatriculaRepository>();

        //Postulaciones
        services.AddScoped<ICambiarEstadoPostulacion, CambiarEstadoPostulacionRepository>();
        services.AddScoped<IPostulacionRepository, PostulacionRepository>();
        services.AddScoped<IMatriculaRepository, MatriculaRepository>();
        services.AddScoped<IGenerarMatricula, GenerarMatriculaRepository>();
        services.AddScoped<IReMatriculacionRepository, ReMatriculacionRepository>();
        services.AddScoped<IAdjuntos, IAdjuntosRepository>();
        services.AddScoped<IAdjuntosAuthorizationService, AdjuntosAuthorizationService>();

        // Notas
        services.AddScoped<IReglasCalculoRepository, ReglasCalculoRepository>();
        services.AddScoped<INotasAlumnoRepository, NotasAlumnoRepository>();

        //Seguridad
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IModuloRepository, ModuloRepository>();
        services.AddScoped<IOperacionRepository, OperacionRepository>();
        services.AddScoped<IRolRepository, RolRepository>();
        services.AddScoped<IModuloOperacionRepository, ModuloOperacionRepository>();
        services.AddScoped<IRolOperacionRepository, RolOperacionRepository>();
        services.AddScoped<IRolUsuarioRepository, RolUsuarioRepository>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IEmailVerificationOtpRepository, EmailVerificationOtpRepository>();


        //Pagos
        services.AddScoped<IPagoCreditoRepository, PagoCreditoRepository>();
        services.AddScoped<IPagoRepository, PagoRepository>();
        services.AddScoped<ICreditoRepository, CreditoRepository>();
        services.AddScoped<IEspecieCicloRepository, EspecieCicloRepository>();
        services.AddScoped<IHistorialPagoRepository, HistorialPagoRepository>();
        services.AddScoped<ISaldoFavorRepository, SaldoFavorRepository>();
        services.AddScoped<IBeneficioRepository, BeneficioRepository>();
        services.AddScoped<IEstudianteBeneficioRepository, EstudianteBeneficioRepository>();
        services.AddScoped<ITipoCuentaRepository, TipoCuentaRepository>();
        services.AddScoped<IEstudianteBeneficioRepository, EstudianteBeneficioRepository>();
        services.AddScoped<ITipoCuentaRepository, TipoCuentaRepository>();
        services.AddScoped<ICuentaBancariaRepository, CuentaBancariaRepository>();
        services.AddScoped<IClienteRepository, ClienteRepository>();
        services.AddScoped<ICreditoBeneficioRepository, CreditoBeneficioRepository>();


        //Services
        services.AddScoped<ICicloService, CicloService>();
        services.AddScoped<IDistributivoRepository, DistributivoRepository>();
        services.AddScoped<IMallaParaleloRepository, MallaParaleloRepository>();
        services.AddScoped<IFileStoragePathService, FileStoragePathService>();
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddHostedService<VencimientoCuotasJob>();


        //ChatBot
        services.AddScoped<IChatBotRepository, ChatBotService>();

        return services;
    }
}
