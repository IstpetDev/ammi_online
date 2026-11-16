using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Adjuntos;

public class AdjuntosAuthorizationService : IAdjuntosAuthorizationService
{
    private static readonly HashSet<string> RolesLectura = new(StringComparer.OrdinalIgnoreCase)
    {
        "Administrador",
        "SuperAdmin",
        "Personal",
        "Docente"
    };

    private static readonly HashSet<string> RolesEliminacion = new(StringComparer.OrdinalIgnoreCase)
    {
        "Administrador",
        "SuperAdmin",
        "Personal"
    };

    private static readonly HashSet<string> RolesPagos = new(StringComparer.OrdinalIgnoreCase)
    {
        "Administrador",
        "SuperAdmin",
        "Personal",
        "Docente",
        "MASTER-CONTABILIDAD",
        "SECRETARIA-GENERAL"
    };

    private readonly Ammi_OnlineContext _context;

    public AdjuntosAuthorizationService(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<bool> PuedeAccederAdjuntoAsync(int idAdjunto, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        if (TieneRol(roles, RolesLectura))
            return true;

        if (idPersona <= 0 || idAdjunto <= 0)
            return false;

        return await EsPropietarioAsync(idAdjunto, idPersona, cancellationToken);
    }

    public async Task<bool> PuedeEliminarAdjuntoAsync(int idAdjunto, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        if (TieneRol(roles, RolesEliminacion))
            return true;

        if (idPersona <= 0 || idAdjunto <= 0)
            return false;

        return await PuedeModificarRegistroAsociadoAsync(idAdjunto, idPersona, cancellationToken);
    }

    public async Task<bool> PuedeModificarDocumentoPersonalAsync(int idDocumentosPersonales, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        if (TieneRol(roles, RolesEliminacion))
            return true;

        if (idPersona <= 0 || idDocumentosPersonales <= 0)
            return false;

        var doc = await _context.DocumentosPersonales
            .AsNoTracking()
            .FirstOrDefaultAsync(dp => dp.IdDocumentosPersonales == idDocumentosPersonales, cancellationToken);

        if (doc == null)
            return false;

        // Solo el propietario puede modificarlo y únicamente si no está aprobado
        return doc.IdPersona == idPersona && doc.Estado != true;
    }

    public async Task<bool> PuedeEliminarDocumentoPersonalAsync(int idDocumentosPersonales, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        return await PuedeModificarDocumentoPersonalAsync(idDocumentosPersonales, idPersona, roles, cancellationToken);
    }

    public async Task<bool> PuedeModificarDiscapacidadAsync(int idPersonaDiscapacidad, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        if (TieneRol(roles, RolesEliminacion))
            return true;

        if (idPersona <= 0 || idPersonaDiscapacidad <= 0)
            return false;

        var disc = await _context.PersonaDiscapacidad
            .AsNoTracking()
            .FirstOrDefaultAsync(pd => pd.IdPersonaDiscapacidad == idPersonaDiscapacidad, cancellationToken);

        if (disc == null)
            return false;

        return disc.IdPersona == idPersona;
    }

    public async Task<bool> PuedeEliminarDiscapacidadAsync(int idPersonaDiscapacidad, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        return await PuedeModificarDiscapacidadAsync(idPersonaDiscapacidad, idPersona, roles, cancellationToken);
    }

    public async Task<bool> PuedeModificarFotoPerfilAsync(int idDocumentosPersonales, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        return await PuedeModificarDocumentoPersonalAsync(idDocumentosPersonales, idPersona, roles, cancellationToken);
    }

    public async Task<bool> PuedeEliminarFotoPerfilAsync(int idDocumentosPersonales, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        return await PuedeModificarDocumentoPersonalAsync(idDocumentosPersonales, idPersona, roles, cancellationToken);
    }

    public async Task<bool> PuedeConsultarPagosPorDocumentoAsync(string documento, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        if (TieneRol(roles, RolesPagos))
            return true;

        if (string.IsNullOrWhiteSpace(documento) || idPersona <= 0)
            return false;

        return await _context.Persona
            .AsNoTracking()
            .AnyAsync(p => p.IdPersona == idPersona && p.Documento == documento, cancellationToken);
    }

    public async Task<bool> PuedeConsultarPagosPorMatriculaAsync(int idMatricula, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        if (TieneRol(roles, RolesPagos))
            return true;

        if (idMatricula <= 0 || idPersona <= 0)
            return false;

        return await _context.Matricula
            .AsNoTracking()
            .AnyAsync(m => m.IdMatricula == idMatricula && m.IdUsuarioAlumno == idPersona, cancellationToken);
    }

    private static bool TieneRol(IEnumerable<string>? roles, HashSet<string> rolesPermitidos)
    {
        if (roles == null) return false;
        return roles.Any(r => rolesPermitidos.Contains(r));
    }

    private async Task<bool> EsPropietarioAsync(int idAdjunto, int idPersona, CancellationToken cancellationToken)
    {
        // 1. Documentos personales de la persona
        var esDocPersonal = await _context.DocumentosPersonales
            .AsNoTracking()
            .AnyAsync(dp => dp.IdAdjunto == idAdjunto && dp.IdPersona == idPersona, cancellationToken);
        if (esDocPersonal) return true;

        // 2. Discapacidad de la persona
        var esDiscapacidad = await _context.PersonaDiscapacidad
            .AsNoTracking()
            .AnyAsync(pd => pd.IdAdjunto == idAdjunto && pd.IdPersona == idPersona, cancellationToken);
        if (esDiscapacidad) return true;

        // 3. Comprobantes de pago registrados por el usuario
        var esPago = await _context.Pago
            .AsNoTracking()
            .AnyAsync(p => p.UrlComprobante == idAdjunto && p.UsuarioRegistro == idPersona, cancellationToken);
        if (esPago) return true;

        return false;
    }

    private async Task<bool> PuedeModificarRegistroAsociadoAsync(int idAdjunto, int idPersona, CancellationToken cancellationToken)
    {
        // 1. Documentos personales de la persona (incluye Foto de Perfil)
        var docPersonal = await _context.DocumentosPersonales
            .AsNoTracking()
            .FirstOrDefaultAsync(dp => dp.IdAdjunto == idAdjunto, cancellationToken);
        if (docPersonal != null)
        {
            // Solo si pertenece a la persona y NO está aprobado (Estado != true)
            return docPersonal.IdPersona == idPersona && docPersonal.Estado != true;
        }

        // 2. Discapacidad de la persona
        var discapacidad = await _context.PersonaDiscapacidad
            .AsNoTracking()
            .FirstOrDefaultAsync(pd => pd.IdAdjunto == idAdjunto, cancellationToken);
        if (discapacidad != null)
        {
            return discapacidad.IdPersona == idPersona;
        }

        // 3. Comprobantes de pago registrados por el usuario
        var pago = await _context.Pago
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UrlComprobante == idAdjunto, cancellationToken);
        if (pago != null)
        {
            // Los comprobantes de pago registrados no pueden ser borrados directamente por estudiantes (evita inconsistencias y fraude contable)
            return false;
        }

        // 4. Cualquier otro registro asociado (Institución, etc.) o archivo huérfano ajeno
        return false;
    }
}
