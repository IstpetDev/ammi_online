using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Postulations;

public interface ICambiarEstadoPostulacion
{
    Task<Postulacion?> GetPostulacionByIdAsync(
        int idPostulacion,
        CancellationToken cancellationToken);

    Task<CambiarEstadoResultado> ProcesarCambioEstadoAsync(
        Postulacion postulacion,
        Usuario? nuevoUsuario,
        RolUsuario? rolUsuario,
        int idParalelo,
        CancellationToken cancellationToken);

    Task<int> ActualizarEstadoPostulacionAsync(
        Postulacion postulacion,
        CancellationToken cancellationToken);

    Task<bool> ExisteMatriculaParaUsuarioAsync(
        int idUsuarioAlumno,
        CancellationToken cancellationToken);

    Task<bool> ExisteUsuarioAsync(
        string username,
        CancellationToken cancellationToken);

    Task EliminarRolUsuarioAsync(
        int idPersona,
        int idRol,
        CancellationToken cancellationToken);

    Task<bool> ExisteUsuarioPorIdPersonaAsync(
        int idPersona,
        CancellationToken cancellationToken);
}

public class CambiarEstadoResultado
{
    public int FilasAfectadas { get; set; }
    public bool UsuarioCreado { get; set; }
    public bool MatriculaCreada { get; set; }
    public int? IdMatricula { get; set; }
    public int CreditosGenerados { get; set; }
    public int DetallesCreditoGenerados { get; set; }
}
