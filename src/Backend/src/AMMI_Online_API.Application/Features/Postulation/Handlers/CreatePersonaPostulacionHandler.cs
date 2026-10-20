using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Commands;
using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Domain.Interfaces.Segurity;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class CreatePersonaPostulacionHandler : IRequestHandler<CreatePersonaPostulacionCommand, Response<int>>
{
    private readonly IPersonaPostulacion _personaPostulacionRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly IAuthRepository _authRepository;

    public CreatePersonaPostulacionHandler(
        IPersonaPostulacion personaPostulacionRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService,
        IAuthRepository authRepository)
    {
        _personaPostulacionRepository = personaPostulacionRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _authRepository = authRepository;
    }

    public async Task<Response<int>> Handle(CreatePersonaPostulacionCommand request, CancellationToken cancellationToken)
    {
        var data = request.personaPostulacion;
        var persona = new Persona
        {
            IdTipoDocumento = data.IdTipoDocumento,
            Documento = data.Documento,
            IdGenero = data.IdGenero,
            PrimerNombre = data.PrimerNombre,
            SegundoNombre = data.SegundoNombre,
            PrimerApellido = data.PrimerApellido,
            SegundoApellido = data.SegundoApellido,
            Activo = true
        };

        var personaInfo = new PersonaInfo
        {
            FechaNacimiento = data.FechaNacimiento,
        };

        var datosContacto = data.DatosContactos.Select(dc => new DatosContacto
        {
            IdTipoDatoContacto = dc.IdTipoDatoContacto,
            Detalle = dc.Detalle,
            EsPrincipal = dc.EsPrincipal
        }).ToList();

        var postulacion = new Postulacion
        {
            IdTipoEstadoAprobacion = 1,
            IdMalla = data.IdMalla,
            IdProvincia = data.IdProvincia,
            FechaPostulacion = DateTime.UtcNow,
            IdUsuarioEvaluador = null,
        };

        // Generar username único (agrega x1, x2, etc. si ya existe)
        var usernameUnico = await _authRepository.GenerarUsernameUnicoAsync(data.Documento, cancellationToken);

        var plainPassword = data.Documento;
        var hashedPassword = _passwordHasher.HashPassword(plainPassword);

        var usuario = new Usuario
        {
            Username = usernameUnico,
            Contrasenia = hashedPassword
        };

        var rolUsuario = new RolUsuario
        {
            IdRol = 1 // Asignar el rol (ID 1) postulante
        };

        var idPersona = await _personaPostulacionRepository.CrearPersonaPostulacionAsync(
            persona,
            personaInfo,
            datosContacto,
            postulacion,
            usuario,
            rolUsuario,
            cancellationToken);

        // Enviar correo
        var correoContacto = datosContacto
            .FirstOrDefault(dc => dc.Detalle.Contains("@"));

        if (correoContacto != null)
        {
            var correoDestino = correoContacto.Detalle;
            var asunto = "Credenciales de Acceso - AMMI Online";
            var cuerpo = $@"
                <h3>Bienvenido a AMMI Online</h3>
                <p>Su postulación ha sido registrada y se le ha asignado una cuenta de usuario.</p>
                <p><strong>Usuario:</strong> {usuario.Username}</p>
                <p><strong>Contraseña:</strong> {plainPassword}</p>
                <p>Por favor, ingrese al sistema y cambie su contraseña.</p>";

            await _emailService.SendEmailAsync(correoDestino, asunto, cuerpo, true, cancellationToken);
        }

        return Response<int>.Success(idPersona, "La Postulación de la Persona creada correctamente");
    }
}

public class CreatePersonaPostulacionManualHandler : IRequestHandler<CreatePersonaPostulacionManualCommand, Response<int>>
{
    private readonly IPersonaPostulacion _personaPostulacionRepository;
    private readonly IEmailService _emailService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICicloService _cicloService;
    private readonly IAuthRepository _authRepository;


    public CreatePersonaPostulacionManualHandler(

        IPersonaPostulacion personaPostulacionRepository,
        IEmailService emailService,
        IPasswordHasher passwordHasher,
        ICicloService cicloService,
        IAuthRepository authRepository)
    {
        _personaPostulacionRepository = personaPostulacionRepository;
        _emailService = emailService;
        _passwordHasher = passwordHasher;
        _cicloService = cicloService;
        _authRepository = authRepository;
    }

    public async Task<Response<int>> Handle(CreatePersonaPostulacionManualCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validación manual del JSON
            if (string.IsNullOrWhiteSpace(request.PersonaPostulacionManualJson))
            {
                throw new Exception("El campo PersonaPostulacionManualJson es requerido y no puede estar vacío");
            }

            CreatePersonaPostulacionManualDTO? data;
            try
            {
                data = JsonSerializer.Deserialize<CreatePersonaPostulacionManualDTO>(
                    request.PersonaPostulacionManualJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (JsonException ex)
            {
                throw new Exception($"Error al deserializar el JSON: {ex.Message}");
            }

            if (data == null)
            {
                throw new Exception("Los datos de la postulación no son válidos o el JSON está malformado");
            }

            var archivoDiscapacidad = request.ArchivoDiscapacidad;
            var archivosDocumentos = request.ArchivosDocumentos ?? new List<IFormFile>();

            // Validar que la cantidad de archivos coincida con los documentos que requieren archivo
            var documentosRequierenArchivo = data.DocumentosPersonales
                .Select(d => d.TieneArchivo)
                .ToList();
            // Validar que la cantidad de archivos coincida con los documentos que requieren archivo
            var documentosConArchivoCount = data.DocumentosPersonales.Count(d => d.TieneArchivo);
            var archivosRecibidos = archivosDocumentos.Count;

            if (documentosConArchivoCount != archivosRecibidos)
            {
                throw new Exception(
                    $"Inconsistencia en archivos. Documentos que requieren archivo: {documentosConArchivoCount}, " +
                    $"Archivos recibidos: {archivosRecibidos}");
            }

            // Validaciones específicas para pago
            if (data.RealizarPagoInicial)
            {
                if (!data.MontoPagoInicial.HasValue || data.MontoPagoInicial.Value <= 0)
                {
                    throw new Exception("Cuando realizarPagoInicial es true, debe proporcionar un monto mayor a 0");
                }

                if (!data.IdTipoPago.HasValue)
                {
                    throw new Exception("Debe especificar el tipo de pago (IdTipoPago)");
                }
            }

            // Buscar el ciclo asociado a la malla seleccionada
            var cicloMalla = await _cicloService.ObtenerCicloPorMallaAsync(data.IdMalla, cancellationToken);
            if (cicloMalla == null)
            {
                throw new Exception($"No se encontró un ciclo asociado a la Malla ID {data.IdMalla}. Verifique que la malla tenga un ciclo asignado.");
            }

            // Validar que el ciclo esté activo
            if (!cicloMalla.EsActivo)
            {
                throw new Exception($"El ciclo '{cicloMalla.Detalle}' asociado a la malla no está activo.");
            }

            // Obtener TODAS las especies del ciclo (no diferibles y diferibles)
            var especiesCiclo = await _cicloService.ObtenerTodasEspeciesCicloAsync(
                cicloMalla.IdCiclo,
                cancellationToken);

            if (!especiesCiclo.Any())
            {
                throw new Exception($"No se encontraron especies configuradas para el ciclo '{cicloMalla.Detalle}'.");
            }

            // Separar especies no diferibles y diferibles
            var especieNoDiferible = especiesCiclo
                .FirstOrDefault(ec => ec.IdEspecieNavigation?.EsDiferible == false);

            var especiesDiferibles = especiesCiclo
                .Where(ec => ec.IdEspecieNavigation?.EsDiferible == true)
                .ToList();

            if (especieNoDiferible == null)
            {
                throw new Exception("No se encontró una especie no diferible configurada para este ciclo.");
            }

            // Mapear entidades
            var persona = new Persona
            {
                IdTipoDocumento = data.IdTipoDocumento,
                Documento = data.Documento,
                IdGenero = data.IdGenero,
                PrimerNombre = data.PrimerNombre,
                SegundoNombre = data.SegundoNombre,
                PrimerApellido = data.PrimerApellido,
                SegundoApellido = data.SegundoApellido,
                Activo = true
            };

            var personaInfo = new PersonaInfo
            {
                FechaNacimiento = data.FechaNacimiento,
                IdEstadoCivil = data.IdEstadoCivil,
                IdNacionalidadEtnica = data.IdNacionalidadEtnica,
                IdTipoSangre = data.IdTipoSangre
            };

            var datosContacto = data.DatosContactos.Select(dc => new DatosContacto
            {
                IdTipoDatoContacto = dc.IdTipoDatoContacto,
                Detalle = dc.Detalle,
                EsPrincipal = dc.EsPrincipal
            }).ToList();

            var direccion = new PersonaDireccion
            {
                IdParroquia = data.IdParroquia,
                DireccionDomiciliaria = data.DireccionDomiciliaria,
                Activo = true
            };

            // Solo crear actividad económica si se proporcionan los datos
            PersonaActividadEconomica? actividadEconomica = null;
            if (data.IdTipoActividadEconomica.HasValue && data.Valor.HasValue)
            {
                actividadEconomica = new PersonaActividadEconomica
                {
                    IdTipoActividadEconomica = data.IdTipoActividadEconomica.Value,
                    Valor = data.Valor,
                    EsPrincipal = data.EsPrincipal.HasValue,
                    Activo = data.Activo.HasValue
                };
            }

            // Solo crear discapacidad si se proporcionan los datos
            PersonaDiscapacidad? discapacidad = null;
            if (data.IdTipoDiscapacidad.HasValue && data.Porcentaje.HasValue)
            {
                discapacidad = new PersonaDiscapacidad
                {
                    Porcentaje = data.Porcentaje.Value,
                    Recomendaciones = data.Recomendaciones,
                    IdTipoDiscapacidad = data.IdTipoDiscapacidad.Value
                };
            }

            var nacionalidad = new PersonaNacionalidad
            {
                IdPais = data.IdPais
            };

            // Crear lista de documentos personales
            var documentosPersonales = data.DocumentosPersonales.Select(doc => new DocumentosPersonales
            {
                IdTipoDocumentoPersonal = doc.IdTipoDocumentoPersonal,
                Estado = doc.Estado ?? null,
                ValorDato = doc.ValorDato ?? true,
                CodigoRequisito = doc.CodigoRequisito,
                Observacion = doc.Observacion
            }).ToList();

            var postulacion = new Postulacion
            {
                IdTipoEstadoAprobacion = 1,
                IdMalla = data.IdMalla,
                FechaPostulacion = DateTime.UtcNow,
                IdUsuarioEvaluador = null,
            };

            // Generar username único (agrega x1, x2, etc. si ya existe)
            var usernameUnico = await _authRepository.GenerarUsernameUnicoAsync(data.Documento, cancellationToken);

            var hashedPassword = _passwordHasher.HashPassword(persona.Documento);
            var usuario = new Usuario
            {
                Username = usernameUnico,
                Contrasenia = hashedPassword
            };
            var usuariorol = new RolUsuario
            {
                IdRol = 1 // Asignar el rol de 'Estudiante' (ID 4)
            };

            //var matricula = new Matricula
            //{
            //    IdParalelo = data.IdParalelo,
            //    EsFinalizada = false
            //};

            //// CREAR LISTA DE CRÉDITOS (uno por cada especie)
            //var creditos = new List<Credito>();
            //var detallesCredito = new List<DetalleCredito>();

            //// 1. Crédito para especie NO DIFERIBLE (obligatorio)
            //var creditoNoDiferible = new Credito
            //{
            //    IdEspecieCiclo = especieNoDiferible.IdEspecieCiclo,
            //    Diferido = 0 // No diferido
            //};

            //var detalleCreditoNoDiferible = new DetalleCredito
            //{
            //    Valor = especieNoDiferible.ValorEspecie,
            //    ValorCancelado = 0,
            //    FechaLimite = DateOnly.FromDateTime(DateTime.UtcNow),
            //    Pagado = false,
            //    FechaPago = null
            //};

            //creditos.Add(creditoNoDiferible);
            //detallesCredito.Add(detalleCreditoNoDiferible);

            //// 2. Créditos para especies DIFERIBLES (opcionales, según configuración)
            //foreach (var especieDiferible in especiesDiferibles)
            //{
            //    var creditoDiferible = new Credito
            //    {
            //        IdEspecieCiclo = especieDiferible.IdEspecieCiclo,
            //        Diferido = 0 // Diferido por defecto , se puede actualizar luego si es necesario
            //    };

            //    creditos.Add(creditoDiferible);
            //}

            //// Lógica para pago inicial (solo aplica a especie no diferible)
            //Pago? pagoInicial = null;
            //if (data.RealizarPagoInicial && data.MontoPagoInicial.HasValue && data.IdTipoPago.HasValue)
            //{
            //    var montoPago = data.MontoPagoInicial.Value;
            //    var valorEspecieNoDiferible = especieNoDiferible.ValorEspecie;

            //    // Validar que el monto no exceda el valor de la especie no diferible
            //    if (montoPago > valorEspecieNoDiferible)
            //    {
            //        throw new Exception($"El monto del pago inicial (${montoPago}) no puede exceder el valor de la especie no diferible (${valorEspecieNoDiferible})");
            //    }

            //    // Aplicar pago al detalle de la especie no diferible
            //    detalleCreditoNoDiferible.ValorCancelado = montoPago;

            //    if (montoPago >= valorEspecieNoDiferible)
            //    {
            //        detalleCreditoNoDiferible.Pagado = true;
            //        detalleCreditoNoDiferible.FechaPago = DateOnly.FromDateTime(DateTime.UtcNow);
            //    }

            //    pagoInicial = new Pago
            //    {
            //        IdTipoPago = data.IdTipoPago.Value,
            //        FechaPago = DateOnly.FromDateTime(DateTime.UtcNow),
            //        ValorPago = montoPago,
            //        EsValidado = true
            //    };
            //}


            // Llamar al repositorio que ahora maneja los archivos
            var idPersona = await _personaPostulacionRepository.CrearPersonaPostulacionManual(
                persona,
                personaInfo,
                datosContacto,
                direccion,
                actividadEconomica,
                discapacidad,
                nacionalidad,
                documentosPersonales,
                postulacion,
                usuario,
                usuariorol,
                // matricula
                // creditos
                // detallesCredito
                // pagoInicial
                archivoDiscapacidad,
                archivosDocumentos,
                documentosRequierenArchivo,
                cancellationToken);
            var plainPassword = persona.Documento; // Guardar contraseña antes de que se pierda

            // Enviar correo de credenciales en segundo plano
            _ = Task.Run(async () =>
            {
                try
                {
                    await EnviarCredencialesPorCorreo(persona, usuario, plainPassword, data, cancellationToken);
                }
                catch (Exception ex)
                {
                    // Manejo de errores al enviar el correo
                    Console.WriteLine($"Error al enviar correo: {ex.Message}");
                }
            }, cancellationToken);

            return Response<int>.Success(idPersona, "La Postulación de la Persona creada correctamente");
        }
        catch (Exception ex)
        {
            // Manejo global de errores
            Console.WriteLine($"Error en la creación de la postulación manual: {ex.Message}");
            throw;
        }
    }

    private async Task EnviarCredencialesPorCorreo(
        Persona persona,
        Usuario usuario,
        string plainPassword,
        CreatePersonaPostulacionManualDTO data,
        CancellationToken cancellationToken)
    {
        // Buscar el correo electrónico en los datos de contacto
        var emailContacto = data.DatosContactos
            .FirstOrDefault(dc => dc.IdTipoDatoContacto == 1)?.Detalle; // Asumiendo que ID 1 es Email

        if (string.IsNullOrWhiteSpace(emailContacto))
        {
            Console.WriteLine("No se encontró un correo electrónico válido para enviar las credenciales.");
            return;
        }

        // Crear el cuerpo del correo
        var cuerpoCorreo = $@"
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
            <p>Su postulación ha sido registrada exitosamente. A continuación encontrará sus credenciales de acceso:</p>
            
            <div class='credentials'>
                <h3>Credenciales de Acceso</h3>
                <p><strong>Usuario:</strong> {usuario.Username}</p>
                <p><strong>Contraseña:</strong> {plainPassword}</p>
                <p><strong>URL del Sistema:</strong> <a href='https://tu-sistema.com'>https://tu-sistema.com</a></p>
            </div>
            
            <p><strong>Instrucciones de Seguridad:</strong></p>
            <ul>
                <li>Guarde esta información en un lugar seguro</li>
                <li>Cambie su contraseña después del primer acceso</li>
                <li>No comparta sus credenciales con nadie</li>
                <li>Si olvida su contraseña, utilice la opción 'Recuperar Contraseña'</li>
            </ul>
            
            <p>Para cualquier duda o consulta, por favor contacte al departamento de soporte.</p>
        </div>
        <div class='footer'>
            <p>© {DateTime.Now.Year} AMMI Online. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
    </div>
</body>
</html>";

        // Enviar el correo
        var asunto = "Credenciales de Acceso - AMMI Online";
        var enviado = await _emailService.SendEmailAsync(
            emailContacto,
            asunto,
            cuerpoCorreo,
            true,
            cancellationToken);

        if (enviado)
        {
            Console.WriteLine("Correo con credenciales enviado exitosamente a {Email}", emailContacto);
        }
        else
        {
            Console.WriteLine("Error al enviar el correo con credenciales a {Email}", emailContacto);
        }
    }
}