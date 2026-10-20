using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Segurity;

public interface IUsuarioRepository
{
    Task<IEnumerable<Usuario>> GetAllAsync(CancellationToken cancellationToken);
    Task<Usuario?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<Usuario> AddAsync(Usuario usuario, CancellationToken cancellationToken);
    Task<Usuario> UpdateAsync(Usuario usuario, CancellationToken cancellationToken);
    Task<Usuario> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
