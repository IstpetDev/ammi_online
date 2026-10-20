using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Catalogs;

public interface ITipoDatoContactoRepository
{
    Task<TipoDatoContacto> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IEnumerable<TipoDatoContacto>> GetAllAsync(CancellationToken cancellationToken);
    Task<TipoDatoContacto> AddAsync(TipoDatoContacto tipoDatoContacto, CancellationToken cancellationToken);
    Task<TipoDatoContacto> UpdateAsync(TipoDatoContacto tipoDatoContacto, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
