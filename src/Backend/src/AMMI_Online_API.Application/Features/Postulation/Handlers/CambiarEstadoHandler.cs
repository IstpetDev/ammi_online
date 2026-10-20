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

    public CambiarEstadoHandler(
        ICambiarEstadoPostulacion cambiarEstadoRepository,
        IGenerarMatricula generarMatriculaRepository,
        IPersona personaRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService,
        IDatosContacto datosContactoRepository,
        IAuthRepository authRepository)
    {
        _cambiarEstadoRepository = cambiarEstadoRepository;
        _generarMatriculaRepository = generarMatriculaRepository;
        _personaRepository = personaRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _datosContactoRepository = datosContactoRepository;
        _authRepository = authRepository;
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

        if (existingPostulacion.IdTipoEstadoAprobacion == 5)
        {
            return Response<CambiarEstadoResultDTO>.Failure(
                "No se puede modificar una postulacion con estado rechazado. " +
                "Este estado es permanente y no permite cambios.");
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
                        Contrasenia = hashedPassword
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
                    existingPostulacion.IdMalla,
                    idParalelo: 1,
                    nuevoUsuario,
                    rolUsuario,
                    cancellationToken);

                resultado.UsuarioCreado = resultadoMatricula.UsuarioCreado;
                resultado.MatriculaCreada = resultadoMatricula.MatriculaCreada;
                resultado.IdMatricula = resultadoMatricula.IdMatricula;
                resultado.CreditosGenerados = resultadoMatricula.CreditosGenerados;
                resultado.DetallesCreditoGenerados = resultadoMatricula.DetallesCreditoGenerados;

                // Enviar correo si se creó usuario
                if (nuevoUsuario != null)
                {
                    var contactos = await _datosContactoRepository.FindAsync(
                        idDatosContacto: null,
                        idPersona: existingPostulacion.IdPersona,
                        idTipoDatoContacto: null,
                        detalle: null,
                        esPrincipal: true,
                        cancellationToken: cancellationToken);

                    var correoContacto = contactos.FirstOrDefault(c => c.Detalle.Contains("@"));

                    if (correoContacto != null)
                    {
                        var correoDestino = correoContacto.Detalle;
                        var asunto = "Credenciales de Acceso - AMMI Online";
                        var cuerpo = $@"
                            <h3>Bienvenido a AMMI Online</h3>
                            <p>Su postulación ha sido aprobada y se le ha asignado una cuenta de usuario.</p>
                            <p><strong>Usuario:</strong> {nuevoUsuario.Username}</p>
                            <p><strong>Contraseña:</strong> {plainPassword}</p>
                            <p>Por favor, ingrese al sistema y cambie su contraseña.</p>";

                        await _emailService.SendEmailAsync(correoDestino, asunto, cuerpo, true, cancellationToken);
                    }
                }
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
