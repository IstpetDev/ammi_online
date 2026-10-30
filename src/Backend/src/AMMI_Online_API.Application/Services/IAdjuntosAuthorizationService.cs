namespace AMMI_Online_API.Application.Services;

public interface IAdjuntosAuthorizationService
{
    Task<bool> PuedeAccederAdjuntoAsync(int idAdjunto, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);
    Task<bool> PuedeEliminarAdjuntoAsync(int idAdjunto, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);
}
