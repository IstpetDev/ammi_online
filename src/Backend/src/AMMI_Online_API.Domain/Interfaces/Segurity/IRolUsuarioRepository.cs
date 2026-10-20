using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Segurity;

public interface IRolUsuarioRepository
{
    Task<RolUsuario?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<RolUsuario>> GetAllAsync(CancellationToken cancellationToken);
    Task<IEnumerable<RolUsuario>> GetByRolAsync(int idRol, CancellationToken cancellationToken);
    Task<IEnumerable<RolUsuario>> GetByPersonaAsync(int idPersona, CancellationToken cancellationToken);
    Task<RolUsuario> AddAsync(RolUsuario rolUsuario, CancellationToken cancellationToken);
    Task<RolUsuario> UpdateAsync(RolUsuario rolUsuario, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
