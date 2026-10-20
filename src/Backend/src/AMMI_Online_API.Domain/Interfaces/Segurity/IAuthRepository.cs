using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Segurity;

public interface IAuthRepository
{
    Task<Usuario?> GetByUsernameAsync(string username, CancellationToken cancellationToken);
    Task<Usuario?> GetByUsernameWithRolesAsync(string username, CancellationToken cancellationToken);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken);
    Task<Usuario> CreateUserAsync(Usuario usuario, CancellationToken cancellationToken);
    Task<bool> UpdatePasswordAsync(int idPersona, string newHashedPassword, CancellationToken cancellationToken);
    Task<IEnumerable<ModuloOperacion>> GetPermisosUsuarioAsync(int idPersona, CancellationToken cancellationToken);
    Task<IEnumerable<RolUsuario>> GetRolesUsuarioAsync(int idPersona, CancellationToken cancellationToken);
    Task<string> GenerarUsernameUnicoAsync(string usernameBase, CancellationToken cancellationToken);
    Task<Usuario?> GetByUsernameWithContactoAsync(string username, CancellationToken cancellationToken);
    Task<Usuario?> GetByIdPersonaAsync(int idPersona, CancellationToken cancellationToken);
    Task<bool> SaveResetTokenAsync(int idPersona, string token, DateTime expiry, CancellationToken cancellationToken);
    Task<Usuario?> GetByResetTokenAsync(string token, CancellationToken cancellationToken);
    Task<bool> ClearResetTokenAsync(int idPersona, CancellationToken cancellationToken);
    Task<bool> SetRequiereCambioContraseniaAsync(int idPersona, bool requiere, CancellationToken cancellationToken);
}
