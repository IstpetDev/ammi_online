using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Postulations;

public interface IGenerarMatricula
{
    Task<int> CrearMatriculacionManual(
        Usuario usuario,
        Matricula matricula,
        Credito credito,
        DetalleCredito detalleCredito,
        CancellationToken cancellationToken);

    Task<GenerarMatriculaResultado> GenerarMatriculaCompletaAsync(
        int idPersona,
        int idMalla,
        int idParalelo,
        Usuario? nuevoUsuario,
        RolUsuario? rolUsuario,
        CancellationToken cancellationToken);
    Task<Matricula?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<Matricula> UpdateAsync(Matricula matricula, CancellationToken cancellationToken);
    Task<bool> ExisteUsuarioPorIdPersonaAsync(int idPersona, CancellationToken cancellationToken);
    Task<bool> ExisteMatriculaParaUsuarioAsync(int idUsuarioAlumno, CancellationToken cancellationToken);
    Task EliminarRolUsuarioAsync(int idPersona, int idRol, CancellationToken cancellationToken);
    
}

public class GenerarMatriculaResultado
{
    public bool UsuarioCreado { get; set; }
    public bool MatriculaCreada { get; set; }
    public int? IdMatricula { get; set; }
    public int CreditosGenerados { get; set; }
    public int DetallesCreditoGenerados { get; set; }
    public int DetallesMatriculaGenerados { get; set; }
}
