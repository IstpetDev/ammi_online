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

    public GenerarMatriculaHandler(IGenerarMatricula generarMatriculaRepository, IPersona personaRepository, IPasswordHasher passwordHasher,
        IEmailService emailService, IDatosContacto datosContactoRepository, IAuthRepository authRepository)
    {
        _generarMatriculaRepository = generarMatriculaRepository;
        _personaRepository = personaRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _datosContactoRepository = datosContactoRepository;
        _authRepository = authRepository;
    }

    public async Task<Response<GenerarMatriculaResultDTO>> Handle(GenerarMatriculaCommand request, CancellationToken cancellationToken)
    {
        var data = request.Data;

        try
        {
            // 1. Obtener persona
            var persona = await _personaRepository.GetByIdAsync(data.IdPersona, cancellationToken);

            if (persona == null)
            {
                return Response<GenerarMatriculaResultDTO>.Failure(
                    $"Persona con ID {data.IdPersona} no encontrada");
            }

            Usuario? nuevoUsuario = null;
            RolUsuario? rolUsuario = null;
            string plainPassword = string.Empty;

            // 2. Verificar si ya existe usuario para esta persona
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
                data.IdParalelo,
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
                    esPrincipal: true,
                    cancellationToken: cancellationToken);

                var correoContacto = contactos.FirstOrDefault(c => c.Detalle.Contains("@"));

                if (correoContacto != null)
                {
                    var correoDestino = correoContacto.Detalle;
                    var asunto = "Credenciales de Acceso - AMMI Online";
                    var cuerpo = $@"
                        <h3>Bienvenido a AMMI Online</h3>
                        <p>Se le ha generado una matrícula y asignado una cuenta de usuario.</p>
                        <p><strong>Usuario:</strong> {nuevoUsuario.Username}</p>
                        <p><strong>Contraseña temporal:</strong> {plainPassword}</p>
                        <p><strong>Al ingresar por primera vez, el sistema le pedirá obligatoriamente que establezca una nueva contraseña personal.</strong></p>";

                    await _emailService.SendEmailAsync(correoDestino, asunto, cuerpo, true, cancellationToken);
                    correoEnviado = true;
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
        entity.IdParalelo = request.IdParalelo;
        entity.EsFinalizada = request.EsFinalizada;
        var result = await _generarMatriculaRepository.UpdateAsync(entity, cancellationToken);
        return Response<bool>.Success(true, "Matrícula actualizada exitosamente.");
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