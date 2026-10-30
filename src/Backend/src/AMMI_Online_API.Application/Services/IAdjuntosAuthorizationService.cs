namespace AMMI_Online_API.Application.Services;

public interface IAdjuntosAuthorizationService
{
    Task<bool> PuedeAccederAdjuntoAsync(int idAdjunto, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);
    Task<bool> PuedeEliminarAdjuntoAsync(int idAdjunto, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);

    Task<bool> PuedeModificarDocumentoPersonalAsync(int idDocumentosPersonales, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);
    Task<bool> PuedeEliminarDocumentoPersonalAsync(int idDocumentosPersonales, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);

    Task<bool> PuedeModificarDiscapacidadAsync(int idPersonaDiscapacidad, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);
    Task<bool> PuedeEliminarDiscapacidadAsync(int idPersonaDiscapacidad, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);

    Task<bool> PuedeModificarFotoPerfilAsync(int idDocumentosPersonales, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);
    Task<bool> PuedeEliminarFotoPerfilAsync(int idDocumentosPersonales, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);

    Task<bool> PuedeConsultarPagosPorDocumentoAsync(string documento, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);
    Task<bool> PuedeConsultarPagosPorMatriculaAsync(int idMatricula, int idPersona, IEnumerable<string> roles, CancellationToken cancellationToken = default);
}
