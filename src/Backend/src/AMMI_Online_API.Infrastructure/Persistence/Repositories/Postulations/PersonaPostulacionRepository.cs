using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

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
                    .ThenInclude(info => info.IdTipoSangreNavigation)
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
                .ThenInclude(m => m.IdTipoOfertaNavigation)
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
            query = query.Where(p => p.IdMallaNavigation.IdTipoOferta == idOferta.Value);

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
                    .ThenInclude(info => info.IdTipoSangreNavigation)
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
                .ThenInclude(m => m.IdTipoOfertaNavigation)
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
            query = query.Where(p => p.IdMallaNavigation.IdTipoOferta == idOferta.Value);

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
            query = query.Where(p => p.IdMallaNavigation.IdCiclo == idCiclo.Value);
        if (idMalla.HasValue)
            query = query.Where(p => p.IdMalla == idMalla.Value);
        if (idOferta.HasValue)
            query = query.Where(p => p.IdMallaNavigation.IdTipoOferta == idOferta.Value);

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
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            // Log del error para debugging
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
}