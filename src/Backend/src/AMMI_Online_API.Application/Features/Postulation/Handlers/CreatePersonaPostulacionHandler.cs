using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulation;
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

        // Validar unicidad antes de intentar insertar
        if (await _personaPostulacionRepository.ExisteDocumentoAsync(data.Documento, cancellationToken))
            return Response<int>.Failure($"El número de documento '{data.Documento}' ya se encuentra registrado.");

        var detallesContacto = data.DatosContactos.Select(dc => dc.Detalle).ToList();
        var contactosDuplicados = await _personaPostulacionRepository.ObtenerContactosDuplicadosAsync(detallesContacto, cancellationToken);
        if (contactosDuplicados.Any())
        {
            var errores = contactosDuplicados.Select(d =>
                d.Contains("@")
                    ? $"El correo electrónico '{d}' ya se encuentra registrado."
                    : $"El número de celular/teléfono '{d}' ya se encuentra registrado.");
            return Response<int>.Failure(string.Join(" ", errores));
        }

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
            IdTipoEstadoAprobacion = 8, // 8 = CONTACTO PERSONA
            IdMalla = data.IdMalla,
            IdProvincia = data.IdProvincia,
            FechaPostulacion = DateTime.UtcNow,
            IdUsuarioEvaluador = null,
            ObservacionesRevision = data.EsPostulacionRapida ? "Postulación rápida externa registrada" : "Postulación externa registrada. Pendiente de contacto.",
            EsPostulacionRapida = data.EsPostulacionRapida,
            ObservacionesPostulante = data.ObservacionesPostulante
        };

        // Generar username único (agrega x1, x2, etc. si ya existe)
        var usernameUnico = await _authRepository.GenerarUsernameUnicoAsync(data.Documento, cancellationToken);

        var plainPassword = data.Documento;
        var hashedPassword = _passwordHasher.HashPassword(plainPassword);

        var usuario = new Usuario
        {
            Username = usernameUnico,
            Contrasenia = hashedPassword,
            RequiereCambioContrasenia = true
        };

        var rolUsuario = new RolUsuario
        {
            IdRol = 1 // Asignar el rol (ID 1) postulante
        };

        int idPersona;
        try
        {
            idPersona = await _personaPostulacionRepository.CrearPersonaPostulacionAsync(
                persona,
                personaInfo,
                datosContacto,
                postulacion,
                usuario,
                rolUsuario,
                cancellationToken);

            // Enviar correo informativo de bienvenida en segundo plano
            _ = Task.Run(async () =>
            {
                try
                {
                    await EnviarNotificacionPostulacionExterna(persona, data.DatosContactos);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CreatePersonaPostulacionHandler] ❌ Error al enviar correo externo: {ex.Message}");
                }
            });
        }
        catch (InvalidOperationException ex)
        {
            return Response<int>.Failure(ex.Message);
        }

        return Response<int>.Success(idPersona, "La Postulación de la Persona creada correctamente");
    }

    private async Task EnviarNotificacionPostulacionExterna(
        Persona persona,
        DatosContactoItem1[] datosContactos)
    {
        var emailContacto = datosContactos
            .FirstOrDefault(dc => (dc.IdTipoDatoContacto == 1 || (dc.Detalle != null && dc.Detalle.Contains("@"))) && !string.IsNullOrWhiteSpace(dc.Detalle))?.Detalle?.Trim();

        if (string.IsNullOrWhiteSpace(emailContacto))
        {
            Console.WriteLine("[CreatePersonaPostulacionHandler] ⚠️ No se encontró un correo electrónico válido para enviar la notificación.");
            return;
        }

        var cuerpoCorreo = $@"
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
        .greeting {{ font-size: 16px; margin-bottom: 15px; color: #1D1E1C; }}
        .highlight-box {{ background-color: #FFFDF0; border: 1px solid #F5E6A3; border-left: 4px solid #E9B902; padding: 20px; margin: 25px 0; border-radius: 6px; }}
        .highlight-title {{ color: #1D1E1C; font-size: 15px; font-weight: 700; margin-top: 0; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }}
        .highlight-text {{ margin: 0; font-size: 14px; color: #363636; line-height: 1.5; }}
        .features {{ margin: 25px 0; padding: 0; list-style: none; }}
        .features li {{ font-size: 13.5px; color: #363636; margin-bottom: 10px; padding-left: 24px; position: relative; }}
        .features li::before {{ content: '✓'; position: absolute; left: 0; color: #E9B902; font-weight: bold; font-size: 15px; }}
        .footer {{ text-align: center; padding: 25px 20px; font-size: 12px; color: #888888; background-color: #FAFAFA; border-top: 1px solid #EEEEEE; }}
        .signature {{ margin-top: 30px; border-top: 1px solid #EEEEEE; padding-top: 15px; font-size: 13.5px; color: #555; }}
    </style>
</head>
<body>
    <div class='wrapper'>
        <div class='container'>
            <div class='header'>
                <div class='badge'>Admisiones</div>
                <h1>¡Hemos recibido tu postulación!</h1>
                <p>AMMI ONLINE &bull; EDUCACIÓN SUPERIOR</p>
            </div>
            <div class='content'>
                <p class='greeting'>Hola <strong>{persona.PrimerNombre} {persona.PrimerApellido}</strong>,</p>
                <p>¡Te damos la bienvenida a <strong>AMMI Online</strong>! Nos entusiasma que hayas dado este paso para impulsar tu formación y futuro profesional con nosotros.</p>
                
                <div class='highlight-box'>
                    <div class='highlight-title'>🎓 ¿Cuáles son los siguientes pasos?</div>
                    <p class='highlight-text'>
                        Nuestro equipo se encuentra preparando todo para brindarte una atención personalizada. 
                        <strong>Muy pronto un asesor educativo se comunicará contigo (vía llamada telefónica o WhatsApp)</strong> 
                        para orientarte sobre la oferta académica, resolver tus dudas sobre las modalidades de estudio y guiarte paso a paso.
                    </p>
                </div>

                <p style='font-size: 14px; font-weight: 600; color: #1D1E1C; margin-bottom: 10px;'>En AMMI Online te ofrecemos:</p>
                <ul class='features'>
                    <li>Acompañamiento docente y asesoría continua en cada etapa.</li>
                    <li>Plataforma de aprendizaje moderna e intuitiva disponible 24/7.</li>
                </ul>

                <p style='font-size: 13.5px; color: #666; margin-top: 20px;'>No necesitas realizar ninguna acción en este momento, ¡estaremos en contacto contigo muy pronto!</p>

                <div class='signature'>
                    Atentamente,<br>
                    <strong style='color: #1D1E1C;'>Equipo de Admisiones y Orientación</strong><br>
                    <span>AMMI Online</span>
                </div>
            </div>
            <div class='footer'>
                <p style='margin: 0 0 5px 0;'>&copy; {DateTime.Now.Year} AMMI Online. Todos los derechos reservados.</p>
                <p style='margin: 0;'>Este es un correo informativo automático, por favor no responder a este mensaje.</p>
            </div>
        </div>
    </div>
</body>
</html>";

        var asunto = "¡Hemos recibido tu postulación! - AMMI Online";
        var enviado = await _emailService.SendEmailAsync(
            emailContacto,
            asunto,
            cuerpoCorreo,
            true);

        if (enviado)
        {
            Console.WriteLine($"[CreatePersonaPostulacionHandler] ✅ Notificación de postulación externa enviada exitosamente a {emailContacto}");
        }
        else
        {
            Console.WriteLine($"[CreatePersonaPostulacionHandler] ❌ Error al enviar notificación de postulación externa a {emailContacto}");
        }
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

            // Validar unicidad antes de intentar insertar
            if (await _personaPostulacionRepository.ExisteDocumentoAsync(data.Documento, cancellationToken))
                return Response<int>.Failure($"El número de documento '{data.Documento}' ya se encuentra registrado.");

            var detallesContacto = data.DatosContactos.Select(dc => dc.Detalle).ToList();
            var contactosDuplicados = await _personaPostulacionRepository.ObtenerContactosDuplicadosAsync(detallesContacto, cancellationToken);
            if (contactosDuplicados.Any())
            {
                var errores = contactosDuplicados.Select(d =>
                    d.Contains("@")
                        ? $"El correo electrónico '{d}' ya se encuentra registrado."
                        : $"El número de celular/teléfono '{d}' ya se encuentra registrado.");
                return Response<int>.Failure(string.Join(" ", errores));
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

            // Obtener TODAS las especies de la malla (matrícula y pensión)
            var especiesCiclo = await _cicloService.ObtenerTodasEspeciesMallaAsync(
                data.IdMalla,
                cancellationToken);

            if (!especiesCiclo.Any())
            {
                throw new Exception($"No se encontraron especies configuradas para la malla seleccionada.");
            }

            // Separar especie de matrícula y especies de pensión
            var especieNoDiferible = especiesCiclo
                .FirstOrDefault(ec => ec.IdEspecieNavigation?.EsMatricula == true);

            var especiesDiferibles = especiesCiclo
                .Where(ec => (ec.IdEspecieNavigation?.EsPension ?? false) && !(ec.IdEspecieNavigation?.EsMatricula ?? false))
                .ToList();

            if (especieNoDiferible == null)
            {
                throw new Exception("No se encontró una especie de matrícula configurada para esta malla.");
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
                IdPais = data.IdPais,
                Nacio = data.Nacio
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

            var tieneDocumentosSubidos = archivosDocumentos != null && archivosDocumentos.Any();
            var postulacion = new Postulacion
            {
                IdTipoEstadoAprobacion = tieneDocumentosSubidos ? 7 : 2, // 7 = DOCUMENTOS_REVISION, 2 = ESPERA_DOCUMENTOS
                IdMalla = data.IdMalla,
                FechaPostulacion = DateTime.UtcNow,
                IdUsuarioEvaluador = null,
                ObservacionesRevision = tieneDocumentosSubidos 
                    ? "Postulación creada por administrador. Documentos cargados para revisión." 
                    : "Postulación creada por administrador. Pendiente de cargar documentos.",
            };

            // Generar username único (agrega x1, x2, etc. si ya existe)
            var usernameUnico = await _authRepository.GenerarUsernameUnicoAsync(data.Documento, cancellationToken);

            var hashedPassword = _passwordHasher.HashPassword(persona.Documento);
            var usuario = new Usuario
            {
                Username = usernameUnico,
                Contrasenia = hashedPassword,
                RequiereCambioContrasenia = true
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
                    await EnviarCredencialesPorCorreo(persona, usuario, plainPassword, data);
                }
                catch (Exception ex)
                {
                    // Manejo de errores al enviar el correo
                    Console.WriteLine($"[CreatePersonaPostulacionManualHandler] ❌ Error al enviar correo de credenciales: {ex.Message}");
                }
            });

            return Response<int>.Success(idPersona, "La Postulación de la Persona creada correctamente");
        }
        catch (InvalidOperationException ex)
        {
            return Response<int>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error en la creación de la postulación manual: {ex.Message}");
            throw;
        }
    }

    private async Task EnviarCredencialesPorCorreo(
        Persona persona,
        Usuario usuario,
        string plainPassword,
        CreatePersonaPostulacionManualDTO data)
    {
        var emailContacto = data.DatosContactos
            .FirstOrDefault(dc => (dc.IdTipoDatoContacto == 1 || (dc.Detalle != null && dc.Detalle.Contains("@"))) && !string.IsNullOrWhiteSpace(dc.Detalle))?.Detalle?.Trim();

        if (string.IsNullOrWhiteSpace(emailContacto))
        {
            Console.WriteLine("[CreatePersonaPostulacionManualHandler] ⚠️ No se encontró un correo electrónico válido para enviar las credenciales.");
            return;
        }

        var cuerpoCorreo = $@"
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
                <div class='badge'>Admisiones</div>
                <h1>Completa tu Postulación</h1>
                <p>AMMI ONLINE &bull; EDUCACIÓN SUPERIOR</p>
            </div>
            <div class='content'>
                <p>Estimado/a <strong>{persona.PrimerNombre} {persona.PrimerApellido}</strong>,</p>
                <p>Tu postulación ha sido registrada exitosamente en <strong>AMMI Online</strong> por el equipo de admisiones. Para continuar con tu proceso y habilitar tu expediente, es necesario que ingreses a la plataforma y <strong>subas los requisitos y documentos solicitados</strong>.</p>
                
                <div class='credentials'>
                    <h3>Tus Credenciales de Acceso</h3>
                    <p style='margin: 6px 0; font-size: 14px;'><strong>Usuario:</strong> <span style='color: #1D1E1C; font-family: monospace; font-size: 15px;'>{usuario.Username}</span></p>
                    <p style='margin: 6px 0; font-size: 14px;'><strong>Contraseña temporal:</strong> <span style='color: #1D1E1C; font-family: monospace; font-size: 15px;'>{plainPassword}</span></p>
                </div>
                
                <div class='steps'>
                    <h4>Instrucciones para continuar:</h4>
                    <ol>
                        <li>Ingresa al portal AMMI Online con tu usuario y contraseña temporal.</li>
                        <li>El sistema te solicitará cambiar tu contraseña por una clave personal.</li>
                        <li>Carga los documentos y requisitos pendientes para que el comité de admisiones evalúe tu postulación.</li>
                    </ol>
                </div>
                
                <p style='font-size: 12.5px; color: #777;'><em>Por tu seguridad, no compartas estas credenciales con terceros y guárdalas en un lugar seguro.</em></p>
                
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

        var asunto = "Credenciales de Acceso y Carga de Requisitos - AMMI Online";
        var enviado = await _emailService.SendEmailAsync(
            emailContacto,
            asunto,
            cuerpoCorreo,
            true);

        if (enviado)
        {
            Console.WriteLine($"[CreatePersonaPostulacionManualHandler] ✅ Correo con credenciales enviado exitosamente a {emailContacto}");
        }
        else
        {
            Console.WriteLine($"[CreatePersonaPostulacionManualHandler] ❌ Error al enviar el correo con credenciales a {emailContacto}");
        }
    }
}