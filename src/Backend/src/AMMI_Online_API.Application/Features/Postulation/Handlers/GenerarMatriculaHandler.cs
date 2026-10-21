using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Catalogs;
using AMMI_Online_API.Domain.Interfaces.Notas;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class GenerarMatriculaHandler : IRequestHandler<GenerarMatriculaCommand, Response<GenerarMatriculaResultDTO>>
{
    private readonly IGenerarMatricula _generarMatriculaRepository;
    private readonly IPersona _personaRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly IDatosContacto _datosContactoRepository;
    private readonly IAuthRepository _authRepository;
    private readonly IInfraestructuraValidationService _validationService;

    public GenerarMatriculaHandler(
        IGenerarMatricula generarMatriculaRepository,
        IPersona personaRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService,
        IDatosContacto datosContactoRepository,
        IAuthRepository authRepository,
        IInfraestructuraValidationService validationService)
    {
        _generarMatriculaRepository = generarMatriculaRepository;
        _personaRepository = personaRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _datosContactoRepository = datosContactoRepository;
        _authRepository = authRepository;
        _validationService = validationService;
    }

    public async Task<Response<GenerarMatriculaResultDTO>> Handle(GenerarMatriculaCommand request, CancellationToken cancellationToken)
    {
        var data = request.Data;

        try
        {
            // 1. Validar que la malla esté completamente configurada
            var (mallaValida, mensajeMalla) = await _validationService
                .ValidarMallaListaParaMatricularAsync(data.IdMalla, cancellationToken);
            if (!mallaValida)
                return Response<GenerarMatriculaResultDTO>.Failure(mensajeMalla);

            // 2. Obtener persona
            var persona = await _personaRepository.GetByIdAsync(data.IdPersona, cancellationToken);

            if (persona == null)
            {
                return Response<GenerarMatriculaResultDTO>.Failure(
                    $"Persona con ID {data.IdPersona} no encontrada");
            }

            Usuario? nuevoUsuario = null;
            RolUsuario? rolUsuario = null;
            string plainPassword = string.Empty;

            // 3. Verificar si ya existe usuario para esta persona
            var usuarioExiste = await _generarMatriculaRepository
                .ExisteUsuarioPorIdPersonaAsync(persona.IdPersona, cancellationToken);

            if (!usuarioExiste)
            {
                // Generar username único
                var usernameUnico = await _authRepository.GenerarUsernameUnicoAsync(persona.Documento, cancellationToken);

                // Contraseña = documento de la persona
                plainPassword = persona.Documento;
                var hashedPassword = _passwordHasher.HashPassword(plainPassword);

                nuevoUsuario = new Usuario
                {
                    IdPersona = persona.IdPersona,
                    Username = usernameUnico,
                    Contrasenia = hashedPassword,
                    RequiereCambioContrasenia = true
                };
            }

            // 3. Asignar rol de alumno (IdRol = 4)
            rolUsuario = new RolUsuario
            {
                IdPersona = persona.IdPersona,
                IdRol = 4
            };

            // 4. Eliminar rol de postulante si existe (IdRol = 1)
            await _generarMatriculaRepository.EliminarRolUsuarioAsync(persona.IdPersona, 1, cancellationToken);

            // 5. Procesar generación de matrícula completa
            var resultadoRepo = await _generarMatriculaRepository.GenerarMatriculaCompletaAsync(
                data.IdPersona,
                data.IdMalla,
                data.IdMallaParalelo,
                nuevoUsuario,
                rolUsuario,
                cancellationToken);

            bool correoEnviado = false;

            // 6. Enviar correo si se creó usuario
            if (nuevoUsuario != null)
            {
                var contactos = await _datosContactoRepository.FindAsync(
                    idDatosContacto: null,
                    idPersona: data.IdPersona,
                    idTipoDatoContacto: null,
                    detalle: null,
                    esPrincipal: null,
                    cancellationToken: cancellationToken);

                var correoContacto = contactos.FirstOrDefault(c => (c.IdTipoDatoContacto == 1 || (c.Detalle != null && c.Detalle.Contains("@"))) && !string.IsNullOrWhiteSpace(c.Detalle))?.Detalle?.Trim();

                if (!string.IsNullOrWhiteSpace(correoContacto))
                {
                    var nombreEstudiante = $"{persona.PrimerNombre} {persona.PrimerApellido}".Trim();
                    if (string.IsNullOrWhiteSpace(nombreEstudiante)) nombreEstudiante = "Estudiante";

                    var asunto = "¡Bienvenido/a a AMMI Online! - Credenciales de Acceso";
                    var cuerpo = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1D1E1C; margin: 0; padding: 0; background-color: #F4F6F9; }}
        .wrapper {{ width: 100%; padding: 30px 0; background-color: #F4F6F9; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border-top: 5px solid #E9B902; }}
        .header {{ background-color: #1D1E1C; color: #FFFFFF; padding: 35px 25px; text-align: center; }}
        .badge {{ display: inline-block; background-color: #E9B902; color: #1D1E1C; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; }}
        .header h1 {{ margin: 0; font-size: 23px; font-weight: 700; color: #FFFFFF; }}
        .header p {{ margin: 6px 0 0 0; color: #FCEA1E; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; }}
        .content {{ padding: 35px 30px; }}
        .credentials {{ background-color: #FAFAFA; border: 1px solid #E9ECEF; border-left: 4px solid #E9B902; padding: 20px; margin: 25px 0; border-radius: 6px; }}
        .credentials h3 {{ margin-top: 0; color: #1D1E1C; font-size: 15px; font-weight: 700; margin-bottom: 12px; }}
        .steps {{ background-color: #FFFDF0; border: 1px solid #F5E6A3; padding: 18px 20px; margin: 25px 0; border-radius: 6px; }}
        .steps h4 {{ margin-top: 0; color: #1D1E1C; font-size: 14px; margin-bottom: 10px; font-weight: 700; }}
        .steps ol {{ margin: 0; padding-left: 20px; }}
        .steps li {{ font-size: 13.5px; color: #363636; margin-bottom: 6px; }}
        .footer {{ text-align: center; padding: 25px 20px; font-size: 12px; color: #888888; background-color: #FAFAFA; border-top: 1px solid #EEEEEE; }}
        .signature {{ margin-top: 30px; border-top: 1px solid #EEEEEE; padding-top: 15px; font-size: 13.5px; color: #555; }}
    </style>
</head>
<body>
    <div class='wrapper'>
        <div class='container'>
            <div class='header'>
                <div class='badge'>Matrícula Generada</div>
                <h1>Credenciales de Acceso</h1>
                <p>AMMI ONLINE &bull; COMUNIDAD ESTUDIANTIL</p>
            </div>
            <div class='content'>
                <p>Estimado/a <strong>{nombreEstudiante}</strong>,</p>
                <p>Se ha formalizado tu matrícula en <strong>AMMI Online</strong> y se ha generado tu cuenta de usuario institucional.</p>
                
                <div class='credentials'>
                    <h3>Tus Credenciales de Acceso</h3>
                    <p style='margin: 6px 0; font-size: 14px;'><strong>Usuario:</strong> <span style='font-family: monospace; font-size: 15px; color: #1D1E1C;'>{nuevoUsuario.Username}</span></p>
                    <p style='margin: 6px 0; font-size: 14px;'><strong>Contraseña temporal:</strong> <span style='font-family: monospace; font-size: 15px; color: #1D1E1C;'>{plainPassword}</span></p>
                </div>
                
                <div class='steps'>
                    <h4>Pasos para ingresar al portal:</h4>
                    <ol>
                        <li>Ingresa a la plataforma con tu usuario y tu contraseña temporal.</li>
                        <li>El sistema te solicitará que establezcas tu nueva contraseña personal.</li>
                        <li>Accede a tu panel para ver tus materias y horarios.</li>
                    </ol>
                </div>
                
                <p style='font-size: 12.5px; color: #777;'><em>Por tu seguridad, no compartas estas credenciales con nadie.</em></p>
                
                <div class='signature'>
                    Atentamente,<br>
                    <strong style='color: #1D1E1C;'>Secretaría General y Admisiones</strong><br>
                    <span>AMMI Online</span>
                </div>
            </div>
            <div class='footer'>
                <p style='margin: 0 0 5px 0;'>&copy; {DateTime.Now.Year} AMMI Online. Todos los derechos reservados.</p>
                <p style='margin: 0;'>Este es un correo automático, por favor no responder a este mensaje.</p>
            </div>
        </div>
    </div>
</body>
</html>";

                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await _emailService.SendEmailAsync(correoContacto, asunto, cuerpo, true);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[GenerarMatriculaHandler] ❌ Error al enviar correo de matrícula: {ex.Message}");
                        }
                    });

                    correoEnviado = true;
                }
                else
                {
                    Console.WriteLine($"[GenerarMatriculaHandler] ⚠️ No se encontró correo para la persona #{data.IdPersona}");
                }
            }

            var resultado = new GenerarMatriculaResultDTO
            {
                UsuarioCreado = resultadoRepo.UsuarioCreado,
                MatriculaCreada = resultadoRepo.MatriculaCreada,
                IdMatricula = resultadoRepo.IdMatricula,
                CreditosGenerados = resultadoRepo.CreditosGenerados,
                DetallesCreditoGenerados = resultadoRepo.DetallesCreditoGenerados,
                DetallesMatriculaGenerados = resultadoRepo.DetallesMatriculaGenerados,
                CorreoEnviado = correoEnviado,
                MensajeUsuario = GenerarMensaje(resultadoRepo, correoEnviado)
            };

            return new Response<GenerarMatriculaResultDTO>(resultado);
        }
        catch (Exception ex)
        {
            return Response<GenerarMatriculaResultDTO>.Failure(
                $"Error al generar la matrícula: {ex.Message}");
        }
    }

    private static string GenerarMensaje(GenerarMatriculaResultado resultado, bool correoEnviado)
    {
        var mensaje = "";

        if (resultado.UsuarioCreado && resultado.MatriculaCreada)
        {
            mensaje = "Usuario y matrícula creados exitosamente.";
        }
        else if (!resultado.UsuarioCreado && resultado.MatriculaCreada)
        {
            mensaje = "El usuario ya existía, matrícula creada.";
        }
        else if (resultado.UsuarioCreado && !resultado.MatriculaCreada)
        {
            mensaje = "Usuario creado, la matrícula ya existía.";
        }
        else
        {
            mensaje = "Usuario y matrícula ya existían.";
        }

        if (correoEnviado)
        {
            mensaje += " Credenciales enviadas por correo.";
        }

        return mensaje;
    }
}

public class UpdateMatriculaHandler : IRequestHandler<UpdateMatriculaCommand, Response<bool>>
{
    private readonly IGenerarMatricula _generarMatriculaRepository;
    public UpdateMatriculaHandler(IGenerarMatricula generarMatriculaRepository)
    {
        _generarMatriculaRepository = generarMatriculaRepository;
    }
    public async Task<Response<bool>> Handle(UpdateMatriculaCommand request, CancellationToken cancellationToken)
    {
        var entity = await _generarMatriculaRepository.GetByIdAsync(request.IdMatricula, cancellationToken);
        if (entity == null)
            return Response<bool>.Failure($"Matrícula con ID {request.IdMatricula} no encontrada.");
        entity.IdUsuarioAlumno = request.IdUsuarioAlumno;
        entity.IdMallaParalelo = request.IdMallaParalelo;
        entity.IdEstadoMatricula = request.IdEstadoMatricula;
        var result = await _generarMatriculaRepository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Matrícula actualizada exitosamente.");
    }
}

public class CambiarParaleloMatriculaHandler : IRequestHandler<CambiarParaleloMatriculaCommand, Response<CambiarParaleloResultDTO>>
{
    private readonly IGenerarMatricula _repository;

    public CambiarParaleloMatriculaHandler(IGenerarMatricula repository)
    {
        _repository = repository;
    }

    public async Task<Response<CambiarParaleloResultDTO>> Handle(CambiarParaleloMatriculaCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var resultado = await _repository.CambiarParaleloAsync(
                request.IdMatricula,
                request.IdMallaParaleloNuevo,
                cancellationToken);

            var mensaje = resultado.NotasBorradas
                ? "Paralelo cambiado exitosamente. Las notas anteriores fueron eliminadas."
                : "Paralelo cambiado exitosamente.";

            return Response<CambiarParaleloResultDTO>.Success(
                new CambiarParaleloResultDTO
                {
                    NotasBorradas = resultado.NotasBorradas,
                    Advertencia = resultado.Advertencia
                },
                mensaje);
        }
        catch (InvalidOperationException ex)
        {
            return Response<CambiarParaleloResultDTO>.Failure(ex.Message);
        }
    }
}

public class RegistrarExamenRemedialHandler : IRequestHandler<RegistrarExamenRemedialCommand, Response<bool>>
{
    private readonly IMatriculaRepository _matriculaRepo;
    private readonly INotasAlumnoRepository _notasRepo;
    private readonly IReglasCalculoRepository _reglasRepo;
    private readonly IPlantillaEstructuraRepository _plantillaRepo;
    private readonly INotasCalculoService _calculoService;

    public RegistrarExamenRemedialHandler(
        IMatriculaRepository matriculaRepo,
        INotasAlumnoRepository notasRepo,
        IReglasCalculoRepository reglasRepo,
        IPlantillaEstructuraRepository plantillaRepo,
        INotasCalculoService calculoService)
    {
        _matriculaRepo = matriculaRepo;
        _notasRepo = notasRepo;
        _reglasRepo = reglasRepo;
        _plantillaRepo = plantillaRepo;
        _calculoService = calculoService;
    }

    public async Task<Response<bool>> Handle(RegistrarExamenRemedialCommand request, CancellationToken cancellationToken)
    {
        if (request.NotaRemedial < 0 || request.NotaRemedial > 10)
            return Response<bool>.Failure("La nota del examen remedial debe estar entre 0 y 10.");

        var dm = await _matriculaRepo.GetDetalleMatriculaByIdAsync(request.IdDetalleMatricula, cancellationToken);
        if (dm == null)
            return Response<bool>.Failure("Detalle de matrícula no encontrado.");

        if (dm.IdDetalleMallaNavigation == null)
            return Response<bool>.Failure("No se pudo obtener la plantilla de evaluación.");

        var estructura = await _plantillaRepo.GetByPlantillaIdAsync(
            dm.IdDetalleMallaNavigation.IdPlantillaEvaluacion, cancellationToken);
        var nodoRaiz = estructura.FirstOrDefault(e => e.IdNodoPadre == null);
        if (nodoRaiz == null)
            return Response<bool>.Failure("La materia no tiene estructura de evaluación definida.");

        var notaRaiz = await _notasRepo.GetNotaByDetalleMatriculaAsync(
            nodoRaiz.IdPlantillaEstructura, request.IdDetalleMatricula, cancellationToken);
        if (notaRaiz?.ValorNota == null)
            return Response<bool>.Failure("El alumno aún no tiene nota final calculada. Complete todas las notas antes de registrar el remedial.");

        var regla = await _reglasRepo.GetByPlantillaEstructuraAsync(nodoRaiz.IdPlantillaEstructura, cancellationToken);
        var notaMinimaAprobar = regla?.NotaMinimaAprobar ?? 7.0m;
        var notaMinimaRecuperar = regla?.NotaMinimaRecuperar ?? 5.0m;

        if (notaRaiz.ValorNota.Value >= notaMinimaAprobar)
            return Response<bool>.Failure("El alumno ya aprobó la materia. No requiere examen remedial.");

        if (notaRaiz.ValorNota.Value < notaMinimaRecuperar)
            return Response<bool>.Failure("La nota del alumno es inferior al mínimo requerido para acceder al examen remedial.");

        await _matriculaRepo.ActualizarExamenRemedialAsync(request.IdDetalleMatricula, request.NotaRemedial, cancellationToken);
        await _calculoService.SincronizarDetalleMatriculaAsync(request.IdDetalleMatricula, cancellationToken);

        return Response<bool>.Success(true, "Examen remedial registrado y resultado actualizado exitosamente.");
    }
}