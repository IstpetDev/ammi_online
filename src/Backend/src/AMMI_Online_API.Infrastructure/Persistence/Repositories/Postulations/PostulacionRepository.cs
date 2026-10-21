using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Postulations;

public class PostulacionRepository : IPostulacionRepository
{
    private readonly Ammi_OnlineContext _context;

    public PostulacionRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Postulacion>> GetPostulacionesByPersonaIdAsync(int idPersona, CancellationToken cancellationToken)
    {
        return await _context.Postulacion
            .AsNoTracking()
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.PersonaInfo)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCursosNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
                    .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
            .Include(p => p.IdTipoEstadoAprobacionNavigation)
            .Where(p => p.IdPersona == idPersona)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Postulacion>> GetAllPostulacionesWithDetailsAsync(CancellationToken cancellationToken)
    {
        return await _context.Postulacion
            .AsNoTrackingWithIdentityResolution()
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.PersonaInfo)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.DocumentosPersonales)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCursosNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
                    .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.MallaRequisitos)
                    .ThenInclude(mr => mr.IdRequisitosNavigation)
            .Include(p => p.IdTipoEstadoAprobacionNavigation)
            .OrderBy(p => p.IdPersonaNavigation.PrimerApellido)
            .ThenBy(p => p.IdPersonaNavigation.SegundoApellido)
            .ThenBy(p => p.IdPersonaNavigation.PrimerNombre)
            .ThenBy(p => p.IdPersonaNavigation.SegundoNombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Postulacion>> GetPostulacionesFilteredWithDetailsAsync(
        int? idCiclo, int? idMalla, int? idTipoEstadoAprobacion, string? search, CancellationToken cancellationToken)
    {
        var query = _context.Postulacion.AsNoTrackingWithIdentityResolution();

        if (idTipoEstadoAprobacion.HasValue && idTipoEstadoAprobacion.Value > 0)
            query = query.Where(p => p.IdTipoEstadoAprobacion == idTipoEstadoAprobacion.Value);

        if (idMalla.HasValue && idMalla.Value > 0)
            query = query.Where(p => p.IdMalla == idMalla.Value || p.EsPostulacionRapida == true);

        if (idCiclo.HasValue && idCiclo.Value > 0)
            query = query.Where(p => (p.IdMallaNavigation != null && p.IdMallaNavigation.IdCiclo == idCiclo.Value) || p.EsPostulacionRapida == true);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(p =>
                (p.IdPersonaNavigation.PrimerNombre != null && EF.Functions.Like(p.IdPersonaNavigation.PrimerNombre, $"%{s}%")) ||
                (p.IdPersonaNavigation.SegundoNombre != null && EF.Functions.Like(p.IdPersonaNavigation.SegundoNombre, $"%{s}%")) ||
                (p.IdPersonaNavigation.PrimerApellido != null && EF.Functions.Like(p.IdPersonaNavigation.PrimerApellido, $"%{s}%")) ||
                (p.IdPersonaNavigation.SegundoApellido != null && EF.Functions.Like(p.IdPersonaNavigation.SegundoApellido, $"%{s}%")) ||
                (p.IdPersonaNavigation.Documento != null && EF.Functions.Like(p.IdPersonaNavigation.Documento, $"%{s}%"))
            );
        }

        return await query
            .AsSplitQuery()
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.PersonaInfo)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.DocumentosPersonales)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.Usuario)
                    .ThenInclude(u => u.Matricula)
                        .ThenInclude(m => m.Credito)
                            .ThenInclude(c => c.IdEspecieCicloNavigation)
                                .ThenInclude(ec => ec.IdEspecieNavigation)
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.Usuario)
                    .ThenInclude(u => u.Matricula)
                        .ThenInclude(m => m.Credito)
                            .ThenInclude(c => c.DetalleCredito)
                                .ThenInclude(dc => dc.PagoCuota)
                                    .ThenInclude(pc => pc.IdPagoNavigation)
                                        .ThenInclude(pago => pago.IdEstadoPagoNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCursosNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
                    .ThenInclude(c => c.IdTipoOfertaNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.IdCicloNavigation)
            .Include(p => p.IdMallaNavigation)
                .ThenInclude(m => m.MallaRequisitos)
                    .ThenInclude(mr => mr.IdRequisitosNavigation)
            .Include(p => p.IdTipoEstadoAprobacionNavigation)
            .OrderBy(p => p.IdPersonaNavigation.PrimerApellido)
            .ThenBy(p => p.IdPersonaNavigation.SegundoApellido)
            .ThenBy(p => p.IdPersonaNavigation.PrimerNombre)
            .ThenBy(p => p.IdPersonaNavigation.SegundoNombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<Postulacion?> GetPostulacionByIdAsync(int idPostulacion, CancellationToken cancellationToken)
    {
        return await _context.Postulacion
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.PersonaInfo)
            .FirstOrDefaultAsync(p => p.IdPostulacion == idPostulacion, cancellationToken);
    }

    public async Task<int> UpdateMallaAsync(int idPostulacion, int idMalla, CancellationToken cancellationToken)
    {
        var postulacion = await _context.Postulacion
            .FirstOrDefaultAsync(p => p.IdPostulacion == idPostulacion, cancellationToken);

        if (postulacion != null)
        {
            postulacion.IdMalla = idMalla;
            return await _context.SaveChangesAsync(cancellationToken);
        }

        return 0;
    }

    public async Task<bool> EliminarPostulacionAsync(int idPostulacion, CancellationToken cancellationToken)
    {
        var postulacion = await _context.Postulacion
            .Include(p => p.IdPersonaNavigation)
            .FirstOrDefaultAsync(p => p.IdPostulacion == idPostulacion, cancellationToken);

        if (postulacion == null)
            return false;

        var idPersona = postulacion.IdPersona;

        // 1. Eliminar documentos personales vinculados a la persona
        var documentosPersonales = await _context.DocumentosPersonales
            .Where(dp => dp.IdPersona == idPersona)
            .ToListAsync(cancellationToken);

        if (documentosPersonales.Any())
        {
            _context.DocumentosPersonales.RemoveRange(documentosPersonales);
        }

        // 2. Eliminar la postulación
        _context.Postulacion.Remove(postulacion);

        // 3. Si la persona no tiene otras relaciones críticas (otras postulaciones, matrículas o usuarios), limpiar datos personales
        var tieneOtrasPostulaciones = await _context.Postulacion
            .AnyAsync(p => p.IdPersona == idPersona && p.IdPostulacion != idPostulacion, cancellationToken);

        var tieneMatriculas = await _context.Matricula
            .AnyAsync(m => m.IdUsuarioAlumno == idPersona, cancellationToken);

        var tieneUsuario = await _context.Usuario
            .AnyAsync(u => u.IdPersona == idPersona, cancellationToken);

        if (!tieneOtrasPostulaciones && !tieneMatriculas && !tieneUsuario)
        {
            var contactos = await _context.DatosContacto.Where(c => c.IdPersona == idPersona).ToListAsync(cancellationToken);
            if (contactos.Any()) _context.DatosContacto.RemoveRange(contactos);

            var info = await _context.PersonaInfo.FirstOrDefaultAsync(pi => pi.IdPersona == idPersona, cancellationToken);
            if (info != null) _context.PersonaInfo.Remove(info);

            var direccion = await _context.PersonaDireccion.FirstOrDefaultAsync(pd => pd.IdPersona == idPersona, cancellationToken);
            if (direccion != null) _context.PersonaDireccion.Remove(direccion);

            var discapacidad = await _context.PersonaDiscapacidad.FirstOrDefaultAsync(pd => pd.IdPersona == idPersona, cancellationToken);
            if (discapacidad != null) _context.PersonaDiscapacidad.Remove(discapacidad);

            var actividad = await _context.PersonaActividadEconomica.FirstOrDefaultAsync(pa => pa.IdPersona == idPersona, cancellationToken);
            if (actividad != null) _context.PersonaActividadEconomica.Remove(actividad);

            var nacionalidad = await _context.PersonaNacionalidad.FirstOrDefaultAsync(pn => pn.IdPersona == idPersona, cancellationToken);
            if (nacionalidad != null) _context.PersonaNacionalidad.Remove(nacionalidad);

            var persona = await _context.Persona.FirstOrDefaultAsync(p => p.IdPersona == idPersona, cancellationToken);
            if (persona != null) _context.Persona.Remove(persona);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ActualizarDatosBasicosPostulanteAsync(
        int idPostulacion,
        string primerNombre,
        string? segundoNombre,
        string primerApellido,
        string? segundoApellido,
        string documento,
        System.DateTime? fechaNacimiento,
        int? idGenero,
        CancellationToken cancellationToken)
    {
        var postulacion = await _context.Postulacion
            .Include(p => p.IdPersonaNavigation)
                .ThenInclude(per => per.PersonaInfo)
            .FirstOrDefaultAsync(p => p.IdPostulacion == idPostulacion, cancellationToken);

        if (postulacion == null || postulacion.IdPersonaNavigation == null)
            return false;

        var persona = postulacion.IdPersonaNavigation;

        if (!string.IsNullOrWhiteSpace(primerNombre))
            persona.PrimerNombre = primerNombre.Trim();

        persona.SegundoNombre = string.IsNullOrWhiteSpace(segundoNombre) ? null : segundoNombre.Trim();

        if (!string.IsNullOrWhiteSpace(primerApellido))
            persona.PrimerApellido = primerApellido.Trim();

        persona.SegundoApellido = string.IsNullOrWhiteSpace(segundoApellido) ? null : segundoApellido.Trim();

        if (!string.IsNullOrWhiteSpace(documento))
            persona.Documento = documento.Trim();

        if (idGenero.HasValue && idGenero.Value > 0)
            persona.IdGenero = idGenero.Value;

        if (fechaNacimiento.HasValue)
        {
            var dateOnly = DateOnly.FromDateTime(fechaNacimiento.Value);
            if (persona.PersonaInfo == null)
            {
                persona.PersonaInfo = new PersonaInfo
                {
                    IdPersona = persona.IdPersona,
                    FechaNacimiento = dateOnly
                };
                _context.PersonaInfo.Add(persona.PersonaInfo);
            }
            else
            {
                persona.PersonaInfo.FechaNacimiento = dateOnly;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
