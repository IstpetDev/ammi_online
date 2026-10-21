using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Postulations;

public class PersonaPostulacionRepository : IPersonaPostulacion
{
    private readonly Ammi_OnlineContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    public PersonaPostulacionRepository(
        Ammi_OnlineContext context,
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _context = context;
        _environment = environment;
        _configuration = configuration;
    }


    public async Task<IEnumerable<Postulacion>> FindAsync(
        string? documento ,
        int? idCiclo,
        int? idMalla,
        int? idOferta,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Postulacion
            .AsNoTracking()
            // Incluir Persona y todas sus relaciones
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.IdGeneroNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaInfo)
                    .ThenInclude(info => info.IdEstadoCivilNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaInfo)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaInfo)
                    .ThenInclude(info => info.IdNacionalidadEtnicaNavigation)
                        .ThenInclude(n => n.IdEtniaNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaDiscapacidad)
                    .ThenInclude(pd => pd.IdTipoDiscapacidadNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaDiscapacidad)
                    .ThenInclude(pd => pd.IdAdjuntoNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaActividadEconomica)
                    .ThenInclude(pae => pae.IdTipoActividadEconomicaNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.DatosContacto)
                    .ThenInclude(dc => dc.IdTipoDatoContactoNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.DocumentosPersonales)
                    .ThenInclude(dp => dp.IdTipoDocumentoPersonalNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.DocumentosPersonales)
                    .ThenInclude(dp => dp.IdAdjuntoNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaDireccion)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaNacionalidad)
            .Include(p => p.IdTipoEstadoAprobacionNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCursosNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
                    .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
                    .ThenInclude(c => c.IdPeriodoNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
                    .ThenInclude(c => c.IdRegimenNavigation)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(documento))
            query = query.Where(p => p.IdPersonaNavigation.Documento == documento);

        if (idCiclo.HasValue)
            query = query.Where(p => p.IdMallaNavigation.IdCiclo == idCiclo.Value);

        if (idMalla.HasValue)
            query = query.Where(p => p.IdMalla == idMalla.Value);

        if (idOferta.HasValue)
            query = query.Where(p => p.IdMallaNavigation.IdCicloNavigation.IdTipoOferta == idOferta.Value);

        return await query
            .OrderByDescending(p => p.FechaPostulacion)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Postulacion>> FindPagedAsync(
        string? documento,
        int? idCiclo,
        int? idMalla,
        int? idOferta,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Postulacion
            .AsNoTracking()
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.IdGeneroNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaInfo)
                    .ThenInclude(info => info.IdEstadoCivilNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaInfo)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaInfo)
                    .ThenInclude(info => info.IdNacionalidadEtnicaNavigation)
                        .ThenInclude(n => n.IdEtniaNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaDiscapacidad)
                    .ThenInclude(pd => pd.IdTipoDiscapacidadNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaDiscapacidad)
                    .ThenInclude(pd => pd.IdAdjuntoNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaActividadEconomica)
                    .ThenInclude(pae => pae.IdTipoActividadEconomicaNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.DatosContacto)
                    .ThenInclude(dc => dc.IdTipoDatoContactoNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.DocumentosPersonales)
                    .ThenInclude(dp => dp.IdTipoDocumentoPersonalNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.DocumentosPersonales)
                    .ThenInclude(dp => dp.IdAdjuntoNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaDireccion)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(persona => persona.PersonaNacionalidad)
            .Include(p => p.IdTipoEstadoAprobacionNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCursosNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
                    .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
                    .ThenInclude(c => c.IdPeriodoNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
                    .ThenInclude(c => c.IdRegimenNavigation)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(documento))
            query = query.Where(p => p.IdPersonaNavigation.Documento == documento);
        if (idCiclo.HasValue)
            query = query.Where(p => (p.EsPostulacionRapida == true) || (p.IdMallaNavigation != null && p.IdMallaNavigation.IdCiclo == idCiclo.Value));
        if (idMalla.HasValue)
            query = query.Where(p => (p.EsPostulacionRapida == true) || p.IdMalla == idMalla.Value);
        if (idOferta.HasValue)
            query = query.Where(p => (p.EsPostulacionRapida == true) || (p.IdMallaNavigation != null && p.IdMallaNavigation.IdCicloNavigation != null && p.IdMallaNavigation.IdCicloNavigation.IdTipoOferta == idOferta.Value));

        return await query
            .OrderByDescending(p => p.FechaPostulacion)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAsync(
        string? documento,
        int? idCiclo,
        int? idMalla,
        int? idOferta,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Postulacion> query = _context.Postulacion.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(documento))
            query = query.Where(p => p.IdPersonaNavigation.Documento == documento);
        if (idCiclo.HasValue)
            query = query.Where(p => (p.EsPostulacionRapida == true) || (p.IdMallaNavigation != null && p.IdMallaNavigation.IdCiclo == idCiclo.Value));
        if (idMalla.HasValue)
            query = query.Where(p => (p.EsPostulacionRapida == true) || p.IdMalla == idMalla.Value);
        if (idOferta.HasValue)
            query = query.Where(p => (p.EsPostulacionRapida == true) || (p.IdMallaNavigation != null && p.IdMallaNavigation.IdCicloNavigation != null && p.IdMallaNavigation.IdCicloNavigation.IdTipoOferta == idOferta.Value));

        return await query.CountAsync(cancellationToken);
    }

    public async Task<int> CrearPersonaPostulacionAsync(
        Persona persona,
        PersonaInfo personaInfo,
        List<DatosContacto> datosContacto,
        Postulacion postulacion,
        Usuario usuario,
        RolUsuario usuariorol,
        CancellationToken cancellationToken)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            _context.Persona.Add(persona);
            await _context.SaveChangesAsync(cancellationToken);

            personaInfo.IdPersona = persona.IdPersona;
            foreach (var contacto in datosContacto)
            {
                contacto.IdPersona = persona.IdPersona;
            }

            postulacion.IdPersona = persona.IdPersona;
            usuario.IdPersona = persona.IdPersona;
            usuariorol.IdPersona = persona.IdPersona;

            _context.PersonaInfo.Add(personaInfo);
            _context.DatosContacto.AddRange(datosContacto);
            _context.Postulacion.Add(postulacion);
            _context.Usuario.Add(usuario);
            _context.RolUsuario.Add(usuariorol);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return persona.IdPersona;
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new InvalidOperationException(TraducirErrorSql(sqlEx), ex);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<int> CrearPersonaPostulacionManual(
        Persona persona,
        PersonaInfo personaInfo,
        List<DatosContacto> datosContacto,
        PersonaDireccion direccion,
        PersonaActividadEconomica actividadEconomica,
        PersonaDiscapacidad? discapacidad,
        PersonaNacionalidad nacionalidad,
        List<DocumentosPersonales> documentosPersonales,
        Postulacion postulacion,
        Usuario usuario,
        RolUsuario usuariorol,
        //Matricula matricula,
        //List<Credito> creditos,
        //List<DetalleCredito> detallesCredito,
        //Pago? pagoInicial,
        IFormFile? archivoDiscapacidad = null,
        List<IFormFile>? archivosDocumentosPersonales = null,
        List<bool>? documentosRequierenArchivo = null,
        CancellationToken cancellationToken = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // 1. Guardar Persona
            _context.Persona.Add(persona);
            await _context.SaveChangesAsync(cancellationToken);

            // 2. Guardar archivo de discapacidad solo si existe la discapacidad y el archivo
            if (discapacidad != null && archivoDiscapacidad != null && archivoDiscapacidad.Length > 0)
            {
                var discapacidadAdjunto = await GuardarArchivoAsync(
                    archivoDiscapacidad,
                    "discapacidad",
                    cancellationToken);

                discapacidad.IdAdjunto = discapacidadAdjunto.IdAdjunto;
            }

            // 3. Guardar archivos de documentos personales SOLO para los que requieren archivo
            if (documentosPersonales != null && archivosDocumentosPersonales != null && documentosRequierenArchivo != null)
            {
                var archivosValidos = archivosDocumentosPersonales
                    .Where(a => a != null && a.Length > 0)
                    .ToList();

                int archivoIndex = 0;
                int documentoIndex = 0;

                // Solo asignar archivos a documentos que requieren archivo
                foreach (var requiereArchivo in documentosRequierenArchivo)
                {
                    if (requiereArchivo && archivoIndex < archivosValidos.Count)
                    {
                        // Solo asignar el archivo si este documento requiere archivo
                        var archivo = archivosValidos[archivoIndex];
                        var adjunto = await GuardarArchivoAsync(
                            archivo,
                            "documentos_personales",
                            cancellationToken);

                        // Asignar el IdAdjunto solo al documento que requiere archivo
                        if (documentoIndex < documentosPersonales.Count)
                        {
                            documentosPersonales[documentoIndex].IdAdjunto = adjunto.IdAdjunto;
                        }

                        archivoIndex++;
                    }
                    documentoIndex++;
                }
            }

            // 4. Asignar IdPersona a todas las entidades
            personaInfo.IdPersona = persona.IdPersona;
            direccion.IdPersona = persona.IdPersona;
            nacionalidad.IdPersona = persona.IdPersona;
            postulacion.IdPersona = persona.IdPersona;
            usuario.IdPersona = persona.IdPersona;
            usuariorol.IdPersona = persona.IdPersona;
            //matricula.IdUsuarioAlumno = usuario.IdPersona;

            if (actividadEconomica != null)
            {
                actividadEconomica.IdPersona = persona.IdPersona;
            }

            if (discapacidad != null)
            {
                discapacidad.IdPersona = persona.IdPersona;
            }

            if (datosContacto != null)
            {
                foreach (var contacto in datosContacto)
                {
                    contacto.IdPersona = persona.IdPersona;
                }
            }

            if (documentosPersonales != null)
            {
                foreach (var docPersonal in documentosPersonales)
                {
                    docPersonal.IdPersona = persona.IdPersona;
                }
            }

            // 5. Guardar todas las entidades EXCEPTO crédito y detalle
            _context.PersonaInfo.Add(personaInfo);
            _context.PersonaDireccion.Add(direccion);
            _context.PersonaNacionalidad.Add(nacionalidad);
            _context.Postulacion.Add(postulacion);
            _context.Usuario.Add(usuario);
            _context.RolUsuario.Add(usuariorol);
            //_context.Matricula.Add(matricula);

            if (actividadEconomica != null)
            {
                _context.PersonaActividadEconomica.Add(actividadEconomica);
            }

            if (datosContacto != null && datosContacto.Any())
                _context.DatosContacto.AddRange(datosContacto);

            if (documentosPersonales != null && documentosPersonales.Any())
                _context.DocumentosPersonales.AddRange(documentosPersonales);

            if (discapacidad != null)
            {
                _context.PersonaDiscapacidad.Add(discapacidad);
            }

            await _context.SaveChangesAsync(cancellationToken); // Guardar para obtener IdMatricula

            //// 6. AHORA crear créditos y detalles (uno por cada especie)
            //var creditosGuardados = new List<Credito>();

            //for (int i = 0; i < creditos.Count; i++)
            //{
            //    var credito = creditos[i];
            //    credito.IdMatricula = matricula.IdMatricula;

            //    _context.Credito.Add(credito);
            //    await _context.SaveChangesAsync(cancellationToken); // Guardar para obtener IdCredito

            //    // Asignar detalle crédito correspondiente
            //    if (i < detallesCredito.Count)
            //    {
            //        var detalle = detallesCredito[i];
            //        detalle.IdCredito = credito.IdCredito;
            //        _context.DetalleCredito.Add(detalle);
            //    }

            //    creditosGuardados.Add(credito);
            //}

            //// 7. Crear pago si existe (asociar al primer crédito - especie no diferible)
            //if (pagoInicial != null && creditosGuardados.Any())
            //{
            //    // Asociar pago al primer crédito (especie no diferible)
            //    pagoInicial.IdCredito = creditosGuardados[0].IdCredito;
            //    _context.Pago.Add(pagoInicial);
            //}

            //await _context.SaveChangesAsync(cancellationToken);

            //// 8. Crear detalles de matrícula automáticos
            //await CrearDetallesMatriculaAutomaticos(
            //    matricula.IdMatricula,
            //    postulacion.IdMalla,
            //    cancellationToken);
            //await _context.SaveChangesAsync(cancellationToken);

            //await CrearDetallesMatriculaAutomaticos(matricula.IdMatricula, postulacion.IdMalla, cancellationToken);
            //await _context.savechangesasync(cancellationtoken);

            await transaction.CommitAsync(cancellationToken);

            return persona.IdPersona;
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx)
        {
            await transaction.RollbackAsync(cancellationToken);
            Console.WriteLine($"Error en CrearPersonaPostulacionManual: {ex.Message}");
            throw new InvalidOperationException(TraducirErrorSql(sqlEx), ex);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            Console.WriteLine($"Error en CrearPersonaPostulacionManual: {ex.Message}");
            Console.WriteLine($"Inner Exception: {ex.InnerException?.Message}");
            throw;
        }
    }

    private async Task<Adjunto> GuardarArchivoAsync(
        IFormFile archivo,
        string subcarpeta,
        CancellationToken cancellationToken)
    {
        if (archivo == null || archivo.Length == 0)
            throw new ArgumentException("El archivo no puede ser nulo o vacío");

        // Validar tamaño máximo
        var maxFileSize = _configuration.GetValue<long>("FileSettings:MaxFileSize", 10 * 1024 * 1024);
        if (archivo.Length > maxFileSize)
            throw new Exception($"El archivo excede el tamaño máximo permitido de {maxFileSize / (1024 * 1024)}MB");

        // Validar extensiones permitidas
        var allowedExtensions = _configuration.GetSection("FileSettings:AllowedExtensions").Get<string[]>()
            ?? new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };

        var fileExtension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
            throw new Exception($"Extensión no permitida. Extensiones permitidas: {string.Join(", ", allowedExtensions)}");

        // Crear carpeta si no existe
        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", subcarpeta);
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        // Generar nombre único para el archivo
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        // Guardar archivo físicamente
        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await archivo.CopyToAsync(fileStream, cancellationToken);
        }

        // Crear registro en la tabla Adjunto
        var adjunto = new Adjunto
        {
            Path = Path.Combine("Uploads", subcarpeta, uniqueFileName).Replace("\\", "/"),
        };

        _context.Adjunto.Add(adjunto);
        await _context.SaveChangesAsync(cancellationToken);

        return adjunto;
    }
    private async Task CrearDetallesMatriculaAutomaticos(
    int idMatricula,
    int idMalla,
    CancellationToken cancellationToken)
    {
        // Obtener todos los detalles de malla para la malla especificada
        var detallesMalla = await _context.DetalleMalla
            .Where(dm => dm.IdMalla == idMalla)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Crear detalles de matrícula para cada detalle de malla
        var detallesMatricula = detallesMalla.Select(dm => new DetalleMatricula
        {
            IdMatricula = idMatricula,
            IdDetalleMalla = dm.IdDetalleMalla
        }).ToList();

        // Agregar al contexto
        _context.DetalleMatricula.AddRange(detallesMatricula);
    }

    public async Task<int> ActualizarPostulacionContactoAsync(
        int idPersona,
        Persona persona,
        PersonaInfo personaInfo,
        List<DatosContacto> datosContacto,
        PersonaDireccion direccion,
        PersonaActividadEconomica? actividadEconomica,
        PersonaDiscapacidad? discapacidad,
        PersonaNacionalidad nacionalidad,
        List<DocumentosPersonales> documentosPersonales,
        Postulacion postulacion,
        IFormFile? archivoDiscapacidad,
        List<IFormFile> archivosDocumentosPersonales,
        List<bool>? documentosRequierenArchivo = null,
        CancellationToken cancellationToken = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // 1. Actualizar Persona existente
            var personaExistente = await _context.Persona.FindAsync(new object[] { idPersona }, cancellationToken);
            if (personaExistente == null)
                throw new InvalidOperationException("Persona no encontrada.");

            personaExistente.IdTipoDocumento = persona.IdTipoDocumento;
            personaExistente.Documento = persona.Documento;
            personaExistente.IdGenero = persona.IdGenero;
            personaExistente.PrimerNombre = persona.PrimerNombre;
            personaExistente.SegundoNombre = persona.SegundoNombre;
            personaExistente.PrimerApellido = persona.PrimerApellido;
            personaExistente.SegundoApellido = persona.SegundoApellido;

            // 2. Actualizar o crear PersonaInfo
            var infoExistente = await _context.PersonaInfo
                .FirstOrDefaultAsync(pi => pi.IdPersona == idPersona, cancellationToken);
            if (infoExistente != null)
            {
                infoExistente.FechaNacimiento = personaInfo.FechaNacimiento;
                infoExistente.IdEstadoCivil = personaInfo.IdEstadoCivil;
                infoExistente.IdNacionalidadEtnica = personaInfo.IdNacionalidadEtnica;
            }
            else
            {
                personaInfo.IdPersona = idPersona;
                _context.PersonaInfo.Add(personaInfo);
            }

            // 3. Eliminar contactos existentes y agregar nuevos
            var contactosExistentes = await _context.DatosContacto
                .Where(dc => dc.IdPersona == idPersona)
                .ToListAsync(cancellationToken);
            if (contactosExistentes.Any())
            {
                _context.DatosContacto.RemoveRange(contactosExistentes);
                await _context.SaveChangesAsync(cancellationToken); // Guardar cambios para borrar en BD antes de insertar nuevos y evitar problemas de unicidad temporal
            }

            foreach (var contacto in datosContacto)
            {
                contacto.IdPersona = idPersona;
            }
            _context.DatosContacto.AddRange(datosContacto);

            // 4. Actualizar o crear Dirección
            var direccionExistente = await _context.PersonaDireccion
                .FirstOrDefaultAsync(pd => pd.IdPersona == idPersona, cancellationToken);
            if (direccionExistente != null)
            {
                direccionExistente.IdParroquia = direccion.IdParroquia;
                direccionExistente.DireccionDomiciliaria = direccion.DireccionDomiciliaria;
                direccionExistente.Activo = true;
            }
            else
            {
                direccion.IdPersona = idPersona;
                _context.PersonaDireccion.Add(direccion);
            }

            // 5. Actualizar o crear Actividad Económica
            var actividadExistente = await _context.PersonaActividadEconomica
                .FirstOrDefaultAsync(pae => pae.IdPersona == idPersona, cancellationToken);
            if (actividadEconomica != null)
            {
                if (actividadExistente != null)
                {
                    actividadExistente.IdTipoActividadEconomica = actividadEconomica.IdTipoActividadEconomica;
                    actividadExistente.Valor = actividadEconomica.Valor;
                    actividadExistente.EsPrincipal = actividadEconomica.EsPrincipal;
                    actividadExistente.Activo = actividadEconomica.Activo;
                }
                else
                {
                    actividadEconomica.IdPersona = idPersona;
                    _context.PersonaActividadEconomica.Add(actividadEconomica);
                }
            }

            // 6. Actualizar o crear Discapacidad
            var discapacidadExistente = await _context.PersonaDiscapacidad
                .FirstOrDefaultAsync(pd => pd.IdPersona == idPersona, cancellationToken);

            if (archivoDiscapacidad != null && archivoDiscapacidad.Length > 0)
            {
                var discapacidadAdjunto = await GuardarArchivoAsync(archivoDiscapacidad, "discapacidad", cancellationToken);
                if (discapacidad != null)
                    discapacidad.IdAdjunto = discapacidadAdjunto.IdAdjunto;
            }

            if (discapacidad != null)
            {
                if (discapacidadExistente != null)
                {
                    discapacidadExistente.Porcentaje = discapacidad.Porcentaje;
                    discapacidadExistente.Recomendaciones = discapacidad.Recomendaciones;
                    discapacidadExistente.IdTipoDiscapacidad = discapacidad.IdTipoDiscapacidad;
                    if (discapacidad.IdAdjunto != 0)
                        discapacidadExistente.IdAdjunto = discapacidad.IdAdjunto;
                }
                else
                {
                    discapacidad.IdPersona = idPersona;
                    _context.PersonaDiscapacidad.Add(discapacidad);
                }
            }

            // 7. Actualizar o crear Nacionalidad
            var nacionalidadExistente = await _context.PersonaNacionalidad
                .FirstOrDefaultAsync(pn => pn.IdPersona == idPersona, cancellationToken);
            if (nacionalidadExistente != null)
            {
                nacionalidadExistente.IdPais = nacionalidad.IdPais;
                nacionalidadExistente.Nacio = nacionalidad.Nacio;
            }
            else
            {
                nacionalidad.IdPersona = idPersona;
                _context.PersonaNacionalidad.Add(nacionalidad);
            }

            // 8. Guardar archivos de documentos personales
            if (documentosPersonales != null && archivosDocumentosPersonales != null && documentosRequierenArchivo != null)
            {
                var archivosValidos = archivosDocumentosPersonales
                    .Where(a => a != null && a.Length > 0)
                    .ToList();

                int archivoIndex = 0;
                int documentoIndex = 0;

                foreach (var requiereArchivo in documentosRequierenArchivo)
                {
                    if (requiereArchivo && archivoIndex < archivosValidos.Count)
                    {
                        var archivo = archivosValidos[archivoIndex];
                        var adjunto = await GuardarArchivoAsync(archivo, "documentos_personales", cancellationToken);

                        if (documentoIndex < documentosPersonales.Count)
                        {
                            documentosPersonales[documentoIndex].IdAdjunto = adjunto.IdAdjunto;
                        }
                        archivoIndex++;
                    }
                    documentoIndex++;
                }
            }

            // 9. Asignar IdPersona a documentos
            if (documentosPersonales != null)
            {
                foreach (var doc in documentosPersonales)
                {
                    doc.IdPersona = idPersona;
                }
                _context.DocumentosPersonales.AddRange(documentosPersonales);
            }

            // 10. Actualizar Postulación
            var postulacionExistente = await _context.Postulacion
                .FirstOrDefaultAsync(p => p.IdPostulacion == postulacion.IdPostulacion, cancellationToken);
            if (postulacionExistente != null)
            {
                postulacionExistente.IdMalla = postulacion.IdMalla;
                postulacionExistente.IdTipoEstadoAprobacion = postulacion.IdTipoEstadoAprobacion;
                postulacionExistente.IdUsuarioEvaluador = postulacion.IdUsuarioEvaluador;
                postulacionExistente.ObservacionesRevision = postulacion.ObservacionesRevision;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return idPersona;
        }
        catch (DbUpdateException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new InvalidOperationException(TraducirDbUpdateException(ex), ex);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            Console.WriteLine($"Error en ActualizarPostulacionContactoAsync: {ex.Message}");
            Console.WriteLine($"Inner Exception: {ex.InnerException?.Message}");
            throw;
        }
    }

    public async Task<IEnumerable<DetalleMalla>> GetDetallesMallaByMallaIdAsync(
    int idMalla,
    CancellationToken cancellationToken)
    {
        return await _context.DetalleMalla
            .AsNoTracking()
            .Where(dm => dm.IdMalla == idMalla)
            .Include(dm => dm.IdMateriaNavigation)
            .ToListAsync(cancellationToken);
    }

    private static string TraducirErrorSql(SqlException sqlEx)
    {
        // 2601 = unique index violation, 2627 = unique constraint violation
        if (sqlEx.Number is 2601 or 2627)
        {
            var msg = sqlEx.Message.ToLower();
            if (msg.Contains("documento"))
                return "El número de documento ya se encuentra registrado.";
            if (msg.Contains("correo") || msg.Contains("email") || msg.Contains("detalle") && msg.Contains("@"))
                return "El correo electrónico ya se encuentra registrado.";
            if (msg.Contains("celular") || msg.Contains("telefono") || msg.Contains("phone"))
                return "El número de celular/teléfono ya se encuentra registrado.";
            if (msg.Contains("username"))
                return "El nombre de usuario ya se encuentra registrado.";
            return $"Ya existe un registro con uno de los datos únicos proporcionados. Detalle: {sqlEx.Message}";
        }

        return $"Error de base de datos: {sqlEx.Message}";
    }
 
    private static string TraducirDbUpdateException(DbUpdateException ex)
    {
        if (ex.InnerException is SqlException sqlEx)
        {
            return TraducirErrorSql(sqlEx);
        }

        var innerMessage = ex.InnerException?.Message ?? "";
        var msgLower = innerMessage.ToLower();

        if (msgLower.Contains("duplicate") || msgLower.Contains("key 'detalle_unique'") || msgLower.Contains("detalle_unique") || msgLower.Contains("key 'documento'") || msgLower.Contains("key 'username'"))
        {
            if (msgLower.Contains("documento"))
                return "El número de documento ya se encuentra registrado.";
            if (msgLower.Contains("correo") || msgLower.Contains("email") || msgLower.Contains("@") || msgLower.Contains("pcontacto") || msgLower.Contains("detalle"))
            {
                if (msgLower.Contains("+") || System.Text.RegularExpressions.Regex.IsMatch(msgLower, @"\b\d{7,15}\b"))
                    return "El número de celular/teléfono ya se encuentra registrado.";
                return "El correo electrónico o número de contacto ya se encuentra registrado por otra persona.";
            }
            if (msgLower.Contains("celular") || msgLower.Contains("telefono") || msgLower.Contains("phone"))
                return "El número de celular/teléfono ya se encuentra registrado.";
            if (msgLower.Contains("username"))
                return "El nombre de usuario ya se encuentra registrado.";
            return "Ya existe un registro con uno de los datos únicos proporcionados.";
        }

        return $"Error de base de datos: {innerMessage}";
    }

    public async Task<bool> ExisteDocumentoAsync(string documento, CancellationToken cancellationToken)
    {
        return await _context.Persona
            .AsNoTracking()
            .AnyAsync(p => p.Documento == documento, cancellationToken);
    }

    public async Task<List<string>> ObtenerContactosDuplicadosAsync(
        IEnumerable<string> detalles,
        CancellationToken cancellationToken)
    {
        var lista = detalles.ToList();
        return await _context.DatosContacto
            .AsNoTracking()
            .Where(dc => lista.Contains(dc.Detalle))
            .Select(dc => dc.Detalle)
            .Distinct()
            .ToListAsync(cancellationToken);
    }
}