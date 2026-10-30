using AMMI_Online_API.Application.Services;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Adjuntos;

public class AdjuntosAuthorizationService : IAdjuntosAuthorizationService
{
    private readonly Ammi_OnlineContext _context;

    public AdjuntosAuthorizationService(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<bool> PuedeAccederAdjuntoAsync(int idAdjunto, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        if (EsRolPrivilegiado(roles))
            return true;

        if (idPersona <= 0 || idAdjunto <= 0)
            return false;

        return await EsPropietarioAsync(idAdjunto, idPersona, cancellationToken);
    }

    public async Task<bool> PuedeEliminarAdjuntoAsync(int idAdjunto, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        if (EsRolPrivilegiado(roles))
            return true;

        if (idPersona <= 0 || idAdjunto <= 0)
            return false;

        return await EsPropietarioAsync(idAdjunto, idPersona, cancellationToken);
    }

    private static bool EsRolPrivilegiado(IEnumerable<string>? roles)
    {
        if (roles == null) return false;
        var privilegios = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Administrador",
            "SuperAdmin",
            "Personal",
            "Docente"
        };
        return roles.Any(r => privilegios.Contains(r));
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
}
