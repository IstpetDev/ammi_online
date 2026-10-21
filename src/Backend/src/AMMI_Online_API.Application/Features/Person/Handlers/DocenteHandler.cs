using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.Features.Person.Commands;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Person;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Handlers;

public class CreateDocenteHandler : IRequestHandler<CreateDocenteCommand, Response<int>>
{
    private const int IdRolProfesor = 3;
    private const int IdTipoDatoContactoEmail = 1;

    private readonly IDocenteRepository _docenteRepository;
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    public CreateDocenteHandler(
        IDocenteRepository docenteRepository,
        IAuthRepository authRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService)
    {
        _docenteRepository = docenteRepository;
        _authRepository = authRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
    }

    public async Task<Response<int>> Handle(CreateDocenteCommand request, CancellationToken cancellationToken)
    {
        // Validaciones básicas
        if (string.IsNullOrWhiteSpace(request.Documento))
            return Response<int>.Failure("El documento es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.PrimerNombre))
            return Response<int>.Failure("El primer nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.PrimerApellido))
            return Response<int>.Failure("El primer apellido es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            return Response<int>.Failure("El correo electrónico no es válido.");

        // Validar que el documento no esté duplicado
        var documentoExiste = await _docenteRepository.ExisteDocumentoAsync(request.Documento, cancellationToken);
        if (documentoExiste)
            return Response<int>.Failure("Ya existe una persona registrada con ese número de documento.");

        // Preparar entidades
        var persona = new Persona
        {
            IdTipoDocumento = request.IdTipoDocumento,
            Documento = request.Documento,
            IdGenero = request.IdGenero,
            PrimerNombre = request.PrimerNombre.Trim(),
            SegundoNombre = request.SegundoNombre?.Trim(),
            PrimerApellido = request.PrimerApellido.Trim(),
            SegundoApellido = request.SegundoApellido?.Trim(),
            Activo = true
        };

        var datosContacto = new DatosContacto
        {
            IdTipoDatoContacto = IdTipoDatoContactoEmail,
            Detalle = request.Email.Trim(),
            EsPrincipal = true
        };

        var username = await _authRepository.GenerarUsernameUnicoAsync(request.Documento, cancellationToken);
        var plainPassword = request.Documento;

        var usuario = new Usuario
        {
            Username = username,
            Contrasenia = _passwordHasher.HashPassword(plainPassword),
            RequiereCambioContrasenia = true
        };

        var rolUsuario = new RolUsuario
        {
            IdRol = IdRolProfesor
        };

        var idPersona = await _docenteRepository.CrearDocenteAsync(
            persona,
            datosContacto,
            usuario,
            rolUsuario,
            cancellationToken);

        // Enviar credenciales por correo en segundo plano
        _ = Task.Run(async () =>
        {
            try
            {
                var cuerpo = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f8f9fa; }}
        .credentials {{ background-color: white; border: 1px solid #ddd; padding: 15px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Bienvenido a AMMI Online</h1>
        </div>
        <div class='content'>
            <p>Estimado/a {persona.PrimerNombre} {persona.PrimerApellido},</p>
            <p>Su cuenta docente ha sido creada exitosamente. A continuación encontrará sus credenciales de acceso:</p>
            <div class='credentials'>
                <h3>Credenciales de Acceso</h3>
                <p><strong>Usuario:</strong> {username}</p>
                <p><strong>Contraseña:</strong> {plainPassword}</p>
            </div>
            <p><strong>Instrucciones de Seguridad:</strong></p>
            <ul>
                <li>Guarde esta información en un lugar seguro.</li>
                <li>Deberá cambiar su contraseña en el primer ingreso al sistema.</li>
                <li>No comparta sus credenciales con nadie.</li>
            </ul>
            <p>Para cualquier duda, contacte al área de soporte.</p>
        </div>
        <div class='footer'>
            <p>© {DateTime.Now.Year} AMMI Online. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
    </div>
</body>
</html>";

                await _emailService.SendEmailAsync(
                    request.Email.Trim(),
                    "Credenciales de Acceso - AMMI Online",
                    cuerpo,
                    true,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al enviar correo de credenciales docente: {ex.Message}");
            }
        }, cancellationToken);

        return Response<int>.Success(idPersona, "Docente creado correctamente.");
    }
}
