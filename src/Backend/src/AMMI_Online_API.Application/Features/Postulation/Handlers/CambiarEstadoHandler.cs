using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class CambiarEstadoHandler : IRequestHandler<CambiarEstadoPostulacionCommand, Response<CambiarEstadoResultDTO>>
{
    private readonly ICambiarEstadoPostulacion _cambiarEstadoRepository;
    private readonly IGenerarMatricula _generarMatriculaRepository;
    private readonly IPersona _personaRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly IDatosContacto _datosContactoRepository;
    private readonly IAuthRepository _authRepository;
    private readonly IInfraestructuraValidationService _validationService;

    public CambiarEstadoHandler(
        ICambiarEstadoPostulacion cambiarEstadoRepository,
        IGenerarMatricula generarMatriculaRepository,
        IPersona personaRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService,
        IDatosContacto datosContactoRepository,
        IAuthRepository authRepository,
        IInfraestructuraValidationService validationService)
    {
        _cambiarEstadoRepository = cambiarEstadoRepository;
        _generarMatriculaRepository = generarMatriculaRepository;
        _personaRepository = personaRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _datosContactoRepository = datosContactoRepository;
        _authRepository = authRepository;
        _validationService = validationService;
    }

    public async Task<Response<CambiarEstadoResultDTO>> Handle(
        CambiarEstadoPostulacionCommand request,
        CancellationToken cancellationToken)
    {
        var data = request.cambiarestado;

        var existingPostulacion = await _cambiarEstadoRepository
            .GetPostulacionByIdAsync(data.IdPostulacion, cancellationToken);

        if (existingPostulacion == null)
        {
            return Response<CambiarEstadoResultDTO>.Failure("La postulacion no existe");
        }

        if (existingPostulacion.IdTipoEstadoAprobacion == 4 || 
            existingPostulacion.IdTipoEstadoAprobacion == 5 || 
            existingPostulacion.IdTipoEstadoAprobacion == 6)
        {
            if (existingPostulacion.IdTipoEstadoAprobacion != data.IdTipoEstadoAprobacion)
            {
                return Response<CambiarEstadoResultDTO>.Failure(
                    "No se puede modificar el estado de una postulación que ya ha sido aprobada, rechazada o finalizada.");
            }
        }

        try
        {
            var postulacion = new Postulacion
            {
                IdPostulacion = data.IdPostulacion,
                IdTipoEstadoAprobacion = data.IdTipoEstadoAprobacion,
                IdUsuarioEvaluador = data.IdEvaluador,
                FechaEvaluada = DateTime.Now,
                ObservacionesRevision = data.ObservacionesRevision
            };

            // Actualizar estado de la postulación
            var filasAfectadas = await _cambiarEstadoRepository.ActualizarEstadoPostulacionAsync(
                postulacion, cancellationToken);

            var resultado = new CambiarEstadoResultDTO
            {
                FilasAfectadas = filasAfectadas,
                UsuarioCreado = false,
                MatriculaCreada = false
            };

            // Si el estado es APROBADO (4), generar matrícula usando IGenerarMatricula
            if (data.IdTipoEstadoAprobacion == 4)
            {
                if (data.IdMallaParalelo == null)
                {
                    return Response<CambiarEstadoResultDTO>.Failure(
                        "Debe especificar el paralelo (IdMallaParalelo) al aprobar una postulación.");
                }

                if (!existingPostulacion.IdMalla.HasValue)
                {
                    return Response<CambiarEstadoResultDTO>.Failure(
                        "La postulación no tiene una Malla asignada. Debe completarse la postulación asignando una malla antes de aprobarla.");
                }

                // Validar que la malla esté completamente configurada antes de matricular
                var (mallaValida, mensajeMalla) = await _validationService
                    .ValidarMallaListaParaMatricularAsync(existingPostulacion.IdMalla.Value, cancellationToken);
                if (!mallaValida)
                    return Response<CambiarEstadoResultDTO>.Failure(mensajeMalla);

                var persona = await _personaRepository
                    .GetByIdAsync(existingPostulacion.IdPersona, cancellationToken);

                if (persona == null)
                {
                    return Response<CambiarEstadoResultDTO>.Failure(
                        $"Persona con ID {existingPostulacion.IdPersona} no encontrada");
                }

                Usuario? nuevoUsuario = null;
                RolUsuario? rolUsuario = null;
                string plainPassword = string.Empty;

                // Verificar si ya existe usuario para esta persona
                var usuarioExiste = await _generarMatriculaRepository
                    .ExisteUsuarioPorIdPersonaAsync(persona.IdPersona, cancellationToken);

                if (!usuarioExiste)
                {
                    // Generar username único
                    var usernameUnico = await _authRepository.GenerarUsernameUnicoAsync(persona.Documento, cancellationToken);

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

                // Asignar rol de alumno (IdRol=4)
                rolUsuario = new RolUsuario
                {
                    IdPersona = persona.IdPersona,
                    IdRol = 4
                };

                // Eliminar rol de postulante si existe
                await _generarMatriculaRepository.EliminarRolUsuarioAsync(persona.IdPersona, 1, cancellationToken);

                // Generar matrícula completa usando el servicio reutilizable
                var resultadoMatricula = await _generarMatriculaRepository.GenerarMatriculaCompletaAsync(
                    existingPostulacion.IdPersona,
                    existingPostulacion.IdMalla.Value,
                    idMallaParalelo: data.IdMallaParalelo.Value,
                    nuevoUsuario,
                    rolUsuario,
                    cancellationToken);

                resultado.UsuarioCreado = resultadoMatricula.UsuarioCreado;
                resultado.MatriculaCreada = resultadoMatricula.MatriculaCreada;
                resultado.IdMatricula = resultadoMatricula.IdMatricula;
                resultado.CreditosGenerados = resultadoMatricula.CreditosGenerados;
                resultado.DetallesCreditoGenerados = resultadoMatricula.DetallesCreditoGenerados;

                // Enviar correo de aprobación y bienvenida en segundo plano
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await EnviarCorreoAprobacionAsync(persona, nuevoUsuario, plainPassword, existingPostulacion.IdPersona, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[CambiarEstadoHandler] Error al enviar correo de aprobación: {ex.Message}");
                    }
                }, cancellationToken);
            }
            // Si el estado es RECHAZADO (5), enviar correo informativo de rechazo
            else if (data.IdTipoEstadoAprobacion == 5)
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var persona = await _personaRepository.GetByIdAsync(existingPostulacion.IdPersona, cancellationToken);
                        if (persona != null)
                        {
                            await EnviarCorreoRechazoAsync(persona, data.ObservacionesRevision, existingPostulacion.IdPersona, cancellationToken);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[CambiarEstadoHandler] Error al enviar correo de rechazo: {ex.Message}");
                    }
                }, cancellationToken);
            }

            resultado.MensajeUsuario = GenerarMensaje(data.IdTipoEstadoAprobacion, resultado);

            return new Response<CambiarEstadoResultDTO>(resultado);
        }
        catch (Exception ex)
        {
            return Response<CambiarEstadoResultDTO>.Failure(
                $"Error al procesar el cambio de estado: {ex.Message}");
        }
    }

    private async Task EnviarCorreoAprobacionAsync(
        Persona persona,
        Usuario? nuevoUsuario,
        string plainPassword,
        int idPersona,
        CancellationToken cancellationToken)
    {
        var contactos = await _datosContactoRepository.FindAsync(
            idDatosContacto: null,
            idPersona: idPersona,
            idTipoDatoContacto: null,
            detalle: null,
            esPrincipal: true,
            cancellationToken: cancellationToken);

        var correoContacto = contactos.FirstOrDefault(c => c.Detalle.Contains("@"))?.Detalle?.Trim();
        if (string.IsNullOrWhiteSpace(correoContacto))
        {
            Console.WriteLine("[CambiarEstadoHandler] ⚠️ No se encontró correo para enviar notificación de aprobación.");
            return;
        }

        string bloqueCredenciales = string.Empty;
        if (nuevoUsuario != null && !string.IsNullOrWhiteSpace(plainPassword))
        {
            bloqueCredenciales = $@"
                <div style='background-color: #FFFDF0; border: 1px solid #F5E6A3; border-left: 4px solid #E9B902; padding: 20px; margin: 25px 0; border-radius: 6px;'>
                    <h3 style='margin-top:0; color:#1D1E1C; font-size:15px; font-weight:700;'>Tus Credenciales de Acceso</h3>
                    <p style='margin:6px 0; font-size:14px;'><strong>Usuario:</strong> <span style='font-family: monospace; font-size:15px; color:#1D1E1C;'>{nuevoUsuario.Username}</span></p>
                    <p style='margin:6px 0; font-size:14px;'><strong>Contraseña temporal:</strong> <span style='font-family: monospace; font-size:15px; color:#1D1E1C;'>{plainPassword}</span></p>
                    <p style='margin:12px 0 0 0; font-size:12.5px; color:#666;'><em>Al ingresar por primera vez, deberás establecer una nueva contraseña personal.</em></p>
                </div>";
        }
        else
        {
            bloqueCredenciales = $@"
                <div style='background-color: #FFFDF0; border-left: 4px solid #E9B902; padding: 18px 20px; margin: 25px 0; border-radius: 6px;'>
                    <p style='margin:0; font-size:14px;'>Puedes ingresar al portal <strong>AMMI Online</strong> con tu usuario habitual para consultar tus asignaturas y horarios de clase.</p>
                </div>";
        }

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
        .footer {{ text-align: center; padding: 25px 20px; font-size: 12px; color: #888888; background-color: #FAFAFA; border-top: 1px solid #EEEEEE; }}
        .signature {{ margin-top: 30px; border-top: 1px solid #EEEEEE; padding-top: 15px; font-size: 13.5px; color: #555; }}
    </style>
</head>
<body>
    <div class='wrapper'>
        <div class='container'>
            <div class='header'>
                <div class='badge'>Admisión Aprobada</div>
                <h1>¡Felicitaciones, Postulación Aprobada!</h1>
                <p>AMMI ONLINE &bull; COMUNIDAD ESTUDIANTIL</p>
            </div>
            <div class='content'>
                <p>Estimado/a <strong>{persona.PrimerNombre} {persona.PrimerApellido}</strong>,</p>
                <p>Nos complace informarte que tu postulación ha sido <strong>APROBADA</strong> con éxito y se ha formalizado tu matrícula en <strong>AMMI Online</strong>. ¡Te damos la más cordial bienvenida a nuestra comunidad académica!</p>
                
                {bloqueCredenciales}
                
                <p style='font-size: 14px;'>Te deseamos el mayor de los éxitos en este nuevo ciclo académico y en el desarrollo de tu carrera profesional.</p>
                
                <div class='signature'>
                    Atentamente,<br>
                    <strong style='color: #1D1E1C;'>Dirección Académica y Admisiones</strong><br>
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

        var asunto = "¡Felicitaciones! Postulación Aprobada y Matrícula Generada - AMMI Online";
        var enviado = await _emailService.SendEmailAsync(correoContacto, asunto, cuerpo, true, cancellationToken);
        if (enviado)
            Console.WriteLine($"[CambiarEstadoHandler] ✅ Correo de aprobación enviado exitosamente a {correoContacto}");
        else
            Console.WriteLine($"[CambiarEstadoHandler] ❌ Error al enviar correo de aprobación a {correoContacto}");
    }

    private async Task EnviarCorreoRechazoAsync(
        Persona persona,
        string? observaciones,
        int idPersona,
        CancellationToken cancellationToken)
    {
        var contactos = await _datosContactoRepository.FindAsync(
            idDatosContacto: null,
            idPersona: idPersona,
            idTipoDatoContacto: null,
            detalle: null,
            esPrincipal: true,
            cancellationToken: cancellationToken);

        var correoContacto = contactos.FirstOrDefault(c => c.Detalle.Contains("@"))?.Detalle?.Trim();
        if (string.IsNullOrWhiteSpace(correoContacto))
        {
            Console.WriteLine("[CambiarEstadoHandler] ⚠️ No se encontró correo para enviar notificación de rechazo.");
            return;
        }

        string bloqueObservaciones = string.Empty;
        if (!string.IsNullOrWhiteSpace(observaciones))
        {
            bloqueObservaciones = $@"
                <div style='background-color: #FFFDF0; border: 1px solid #F5E6A3; border-left: 4px solid #E9B902; padding: 18px 20px; margin: 25px 0; border-radius: 6px;'>
                    <h4 style='margin-top:0; color:#1D1E1C; font-size:14px; margin-bottom:8px;'>Observaciones de la evaluación:</h4>
                    <p style='margin:0; font-size:13.5px; color:#363636;'>{observaciones}</p>
                </div>";
        }

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
        .footer {{ text-align: center; padding: 25px 20px; font-size: 12px; color: #888888; background-color: #FAFAFA; border-top: 1px solid #EEEEEE; }}
        .signature {{ margin-top: 30px; border-top: 1px solid #EEEEEE; padding-top: 15px; font-size: 13.5px; color: #555; }}
    </style>
</head>
<body>
    <div class='wrapper'>
        <div class='container'>
            <div class='header'>
                <div class='badge'>Estado de Postulación</div>
                <h1>Estado de tu Postulación</h1>
                <p>AMMI ONLINE &bull; EDUCACIÓN SUPERIOR</p>
            </div>
            <div class='content'>
                <p>Estimado/a <strong>{persona.PrimerNombre} {persona.PrimerApellido}</strong>,</p>
                <p>Te informamos que, tras la revisión y evaluación de tu postulación y los documentos registrados en <strong>AMMI Online</strong>, tu solicitud no ha sido aprobada para el ciclo académico actual.</p>
                
                {bloqueObservaciones}
                
                <p style='font-size: 13.5px; color: #555;'>Si deseas recibir mayor información, subsanar las observaciones señaladas o consultar sobre futuros períodos de admisión, puedes comunicarte con nuestro departamento de admisiones.</p>
                
                <div class='signature'>
                    Atentamente,<br>
                    <strong style='color: #1D1E1C;'>Departamento de Admisiones</strong><br>
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

        var asunto = "Notificación sobre el Estado de tu Postulación - AMMI Online";
        var enviado = await _emailService.SendEmailAsync(correoContacto, asunto, cuerpo, true, cancellationToken);
        if (enviado)
            Console.WriteLine($"[CambiarEstadoHandler] ✅ Correo de rechazo enviado exitosamente a {correoContacto}");
        else
            Console.WriteLine($"[CambiarEstadoHandler] ❌ Error al enviar correo de rechazo a {correoContacto}");
    }

    private static string GenerarMensaje(int idTipoEstadoAprobacion, CambiarEstadoResultDTO resultado)
    {
        if (idTipoEstadoAprobacion != 4)
        {
            return "Estado de postulacion actualizado correctamente";
        }

        if (resultado.UsuarioCreado && resultado.MatriculaCreada)
        {
            return "Postulacion aprobada. Usuario y matricula creados exitosamente.";
        }

        if (!resultado.UsuarioCreado && resultado.MatriculaCreada)
        {
            return "Postulacion aprobada. El usuario ya existia, matricula creada.";
        }

        if (resultado.UsuarioCreado && !resultado.MatriculaCreada)
        {
            return "Postulacion aprobada. Usuario creado, matricula ya existia.";
        }

        return "Postulacion aprobada. Usuario y matricula ya existian.";
    }
}
