using AMMI_Online_API.Domain.Entities;

namespace AMMI_Online_API.Domain.Interfaces.Payments;

public interface IClienteRepository 
{
        Task<Cliente?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<IEnumerable<Cliente>> GetAllAsync(
            int? idCliente,
            string? nombre,
            string? apellido,
            string? correo,
            string? celular,
            string? direccion,
            bool? activo,
            CancellationToken cancellationToken);
        Task<Cliente> AddAsync(Cliente cliente, CancellationToken cancellationToken);
        Task<Cliente> UpdateAsync(Cliente cliente, CancellationToken cancellationToken);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
        Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}
