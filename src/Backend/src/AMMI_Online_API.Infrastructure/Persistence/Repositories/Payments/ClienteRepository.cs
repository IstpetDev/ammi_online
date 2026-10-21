using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Payments;
using AMMI_Online_API.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AMMI_Online_API.Infrastructure.Persistence.Repositories.Payments;

public class ClienteRepository : IClienteRepository
{
    private readonly Ammi_OnlineContext _context;

    public ClienteRepository(Ammi_OnlineContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Cliente?>> GetAllAsync(
        int? idCliente,
        string? nombre,
        string? apellido,
        string? correo,
        string? celular,
        string? direccion,
        bool? activo,
        CancellationToken cancellationToken)
    {
        var query = _context.Cliente.AsQueryable();
        if (idCliente.HasValue)
            query = query.Where(x => x.IdCliente == idCliente.Value);
        if (!string.IsNullOrEmpty(nombre))
            query = query.Where(x => x.Nombres.Contains(nombre));
        if (!string.IsNullOrEmpty(apellido))
            query = query.Where(x => x.Apellidos.Contains(apellido));
        if (!string.IsNullOrEmpty(correo))
            query = query.Where(x => x.Correo.Contains(correo));
        if (!string.IsNullOrEmpty(celular))
            query = query.Where(x => x.Celular.Contains(celular));
        if (!string.IsNullOrEmpty(direccion))
            query = query.Where(x => x.Direccion.Contains(direccion));
        if (activo.HasValue)
            query = query.Where(x => x.Activo == activo.Value);

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Cliente?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Cliente
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdCliente == id, cancellationToken);
    }   

    public async Task<Cliente> AddAsync(Cliente cliente, CancellationToken cancellationToken)
    {
        await _context.Cliente.AddAsync(cliente, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return cliente;
    }

    public async Task<Cliente> UpdateAsync(Cliente cliente, CancellationToken cancellationToken)
    {
        _context.Cliente.Update(cliente);
        await _context.SaveChangesAsync(cancellationToken);
        return cliente;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _context.Cliente.FindAsync(new object[] { id }, cancellationToken);
        if (entity == null)
            return false;
        entity.Activo = false;
        _context.Cliente.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Cliente
            .AnyAsync(c => c.IdCliente == id, cancellationToken);
    }
}
